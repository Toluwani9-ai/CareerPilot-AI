import json
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from google import genai
from google.genai import types


# Always load the .env file that sits beside this file.
ENV_PATH = Path(__file__).with_name(".env")
load_dotenv(dotenv_path=ENV_PATH, override=True)

# Gemini configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash").strip()
AI_ENABLED = os.getenv("CAREERPILOT_AI_ENABLED", "false").strip().lower() == "true"

# The response contains several sections, including 10 interview questions.
# A larger output budget helps prevent truncated/invalid JSON.
MAX_OUTPUT_TOKENS = 6000
MAX_GENERATION_ATTEMPTS = 2


class GeminiConfigurationError(RuntimeError):
    """Raised when Gemini has not been configured correctly."""


class GeminiGenerationError(RuntimeError):
    """Raised when Gemini cannot generate a usable response."""


def _get_client() -> genai.Client:
    if not AI_ENABLED:
        raise GeminiConfigurationError(
            "Gemini is disabled. Set CAREERPILOT_AI_ENABLED=true in backend/.env."
        )

    if not GEMINI_API_KEY:
        raise GeminiConfigurationError(
            "GEMINI_API_KEY is missing from backend/.env."
        )

    if not GEMINI_MODEL:
        raise GeminiConfigurationError(
            "GEMINI_MODEL is missing from backend/.env."
        )

    return genai.Client(api_key=GEMINI_API_KEY)


def _clean_string(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _clean_string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []

    cleaned: list[str] = []
    seen: set[str] = set()

    for item in value:
        text = _clean_string(item)
        key = text.casefold()

        if text and key not in seen:
            cleaned.append(text)
            seen.add(key)

    return cleaned


def _strip_markdown_fence(text: str) -> str:
    """Remove an accidental ```json ... ``` wrapper if Gemini includes one."""
    cleaned = text.strip()

    if cleaned.startswith("```"):
        lines = cleaned.splitlines()

        if lines and lines[0].strip().lower() in {"```", "```json"}:
            lines = lines[1:]

        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]

        cleaned = "\n".join(lines).strip()

    return cleaned


def _extract_json_object(text: str) -> str:
    """Best-effort recovery if text appears before/after the JSON object."""
    cleaned = _strip_markdown_fence(text)

    first = cleaned.find("{")
    last = cleaned.rfind("}")

    if first != -1 and last != -1 and last > first:
        return cleaned[first : last + 1]

    return cleaned


def _normalise_learning_roadmap(value: Any) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        return []

    roadmap: list[dict[str, Any]] = []

    for item in value:
        if not isinstance(item, dict):
            continue

        skill = _clean_string(item.get("skill"))
        objective = _clean_string(item.get("objective"))
        activities = _clean_string_list(item.get("activities"))
        portfolio_project = _clean_string(item.get("portfolio_project"))

        if not skill:
            continue

        roadmap.append(
            {
                "skill": skill,
                "objective": objective,
                "activities": activities,
                "portfolio_project": portfolio_project,
            }
        )

    return roadmap


def _normalise_interview_questions(value: Any) -> list[dict[str, str]]:
    if not isinstance(value, list):
        return []

    questions: list[dict[str, str]] = []

    for item in value:
        if not isinstance(item, dict):
            continue

        question = _clean_string(item.get("question"))
        purpose = _clean_string(item.get("purpose"))
        answer_guidance = _clean_string(item.get("answer_guidance"))

        if not question:
            continue

        questions.append(
            {
                "question": question,
                "purpose": purpose,
                "answer_guidance": answer_guidance,
            }
        )

    return questions


def _response_finish_reason(response: Any) -> str:
    """Return a readable Gemini finish reason for debugging."""
    try:
        candidates = getattr(response, "candidates", None) or []
        if not candidates:
            return ""

        finish_reason = getattr(candidates[0], "finish_reason", None)
        return str(finish_reason or "")
    except Exception:
        return ""


def _parse_response_json(response: Any) -> dict[str, Any]:
    raw_text = _clean_string(getattr(response, "text", ""))

    if not raw_text:
        finish_reason = _response_finish_reason(response)
        extra = f" Finish reason: {finish_reason}." if finish_reason else ""
        raise GeminiGenerationError(
            f"Gemini returned an empty response.{extra}"
        )

    candidate_text = _extract_json_object(raw_text)

    try:
        result = json.loads(candidate_text)
    except json.JSONDecodeError as exc:
        finish_reason = _response_finish_reason(response)

        print("GEMINI JSON PARSE ERROR:", repr(exc))
        if finish_reason:
            print("GEMINI FINISH REASON:", finish_reason)
        print("GEMINI RAW RESPONSE (truncated to 4000 chars):")
        print(raw_text[:4000])

        raise GeminiGenerationError(
            "Gemini returned an incomplete or invalid JSON response."
        ) from exc

    if not isinstance(result, dict):
        raise GeminiGenerationError(
            "Gemini returned JSON in an unexpected format; an object was expected."
        )

    return result


def _normalise_result(result: dict[str, Any]) -> dict[str, Any]:
    recommendation = result.get("career_recommendation")
    if not isinstance(recommendation, dict):
        recommendation = {}

    learning_roadmap = _normalise_learning_roadmap(
        result.get("learning_roadmap")
    )

    interview_questions = _normalise_interview_questions(
        result.get("interview_questions")
    )

    # InterviewPractice.jsx needs Gemini questions in this array.
    # Treat zero usable questions as an invalid AI result so we can retry.
    if not interview_questions:
        raise GeminiGenerationError(
            "Gemini returned no usable interview questions."
        )

    return {
        "provider": "gemini",
        "model": GEMINI_MODEL,
        "professional_summary": _clean_string(
            result.get("professional_summary")
        ),
        "career_recommendation": {
            "title": _clean_string(recommendation.get("title")),
            "reason": _clean_string(recommendation.get("reason")),
            "next_steps": _clean_string_list(
                recommendation.get("next_steps")
            ),
        },
        "learning_roadmap": learning_roadmap,
        "interview_questions": interview_questions,
        "cover_letter_points": _clean_string_list(
            result.get("cover_letter_points")
        ),
        "warnings": _clean_string_list(result.get("warnings")),
    }


def _build_prompt(
    cv_text: str,
    job_description: str,
    detected_skills: list[str],
    matched_skills: list[str],
    missing_skills: list[str],
) -> str:
    return f"""
You are the career-guidance component of CareerPilot AI.

Use only the evidence supplied below.
Do not invent qualifications, employment history, projects, certifications,
achievements, employers, job titles, dates, or experience.

CV TEXT:
{cv_text[:12000]}

JOB DESCRIPTION:
{job_description[:8000]}

DETECTED CV SKILLS:
{json.dumps(detected_skills)}

MATCHED SKILLS:
{json.dumps(matched_skills)}

MISSING SKILLS:
{json.dumps(missing_skills)}

Generate practical and supportive career guidance for a student or graduate.

Important rules:
1. Use only the information provided from the CV and job description.
2. Do not change the supplied matched-skills or missing-skills results.
3. Use simple, clear and grammatically correct English.
4. Keep the responses clear and short so the complete JSON fits in the response.
5. Return exactly 10 interview_questions.
6. Each interview question must be specific to the supplied CV, job description,
   matched skills, missing skills, or recommended career direction.
7. interview_questions must contain objects with:
   - question
   - purpose
   - answer_guidance
8. cover_letter_points must only use facts directly from the provided CV,
   Do not fabricate job history or extra details.
9. learning_roadmap should focus mainly on the supplied missing skills.
10. Return only valid JSON matching the required schema.
""".strip()


RESPONSE_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "professional_summary": {
            "type": "string",
        },
        "career_recommendation": {
            "type": "object",
            "properties": {
                "title": {"type": "string"},
                "reason": {"type": "string"},
                "next_steps": {
                    "type": "array",
                    "items": {"type": "string"},
                },
            },
            "required": [
                "title",
                "reason",
                "next_steps",
            ],
        },
        "learning_roadmap": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "skill": {"type": "string"},
                    "objective": {"type": "string"},
                    "activities": {
                        "type": "array",
                        "items": {"type": "string"},
                    },
                    "portfolio_project": {
                        "type": "string",
                    },
                },
                "required": [
                    "skill",
                    "objective",
                    "activities",
                    "portfolio_project",
                ],
            },
        },
        "interview_questions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "question": {"type": "string"},
                    "purpose": {"type": "string"},
                    "answer_guidance": {"type": "string"},
                },
                "required": [
                    "question",
                    "purpose",
                    "answer_guidance",
                ],
            },
        },
        "cover_letter_points": {
            "type": "array",
            "items": {"type": "string"},
        },
        "warnings": {
            "type": "array",
            "items": {"type": "string"},
        },
    },
    "required": [
        "professional_summary",
        "career_recommendation",
        "learning_roadmap",
        "interview_questions",
        "cover_letter_points",
        "warnings",
    ],
}


def generate_career_guidance(
    cv_text: str,
    job_description: str,
    detected_skills: list[str],
    matched_skills: list[str],
    missing_skills: list[str],
) -> dict[str, Any]:
    """
    Generate structured Gemini career guidance from an existing deterministic
    CV analysis.

    The deterministic analysis remains the source of truth. Gemini only
    explains and extends that result.
    """
    cv_text = _clean_string(cv_text)
    job_description = _clean_string(job_description)

    if not cv_text:
        raise ValueError("CV text cannot be empty.")

    if not job_description:
        raise ValueError("Job description cannot be empty.")

    prompt = _build_prompt(
        cv_text=cv_text,
        job_description=job_description,
        detected_skills=detected_skills,
        matched_skills=matched_skills,
        missing_skills=missing_skills,
    )

    client = _get_client()
    last_error: Exception | None = None

    try:
        for attempt in range(1, MAX_GENERATION_ATTEMPTS + 1):
            try:
                response = client.models.generate_content(
                    model=GEMINI_MODEL,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.2,
                        max_output_tokens=MAX_OUTPUT_TOKENS,
                        response_mime_type="application/json",
                        response_schema=RESPONSE_SCHEMA,
                    ),
                )

                parsed = _parse_response_json(response)
                normalised = _normalise_result(parsed)

                return normalised

            except GeminiGenerationError as exc:
                last_error = exc
                print(
                    f"GEMINI GENERATION ATTEMPT "
                    f"{attempt}/{MAX_GENERATION_ATTEMPTS} FAILED:",
                    str(exc),
                )

                if attempt >= MAX_GENERATION_ATTEMPTS:
                    raise

            except Exception as exc:
                print("GEMINI REAL ERROR:", repr(exc))
                raise GeminiGenerationError(
                    f"Gemini could not generate career guidance: {exc}"
                ) from exc

    finally:
        try:
            client.close()
        except Exception:
            pass

    raise GeminiGenerationError(
        f"Gemini could not generate career guidance: {last_error}"
    )