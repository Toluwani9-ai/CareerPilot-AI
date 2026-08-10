import json
import os
from typing import Any

from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel, Field


load_dotenv()

# Default Gemini model
DEFAULT_MODEL = "gemini-2.5-flash"


class AIRecommendationError(RuntimeError):
    """Raised when Gemini guidance cannot be generated."""

# AI response model
class CareerGuidance(BaseModel):
    """Structured guidance returned by Gemini."""

    summary: str = Field(
        description="A concise summary of the candidate's suitability."
    )
    career_reasoning: str = Field(
        description="Why the recommended career fits the verified analysis."
    )
    strength_highlights: list[str] = Field(
        description="Verified candidate strengths."
    )
    development_advice: list[str] = Field(
        description="Practical advice for the verified missing skills."
    )

    # Interview questions
    interview_questions: list[str] = Field(
        description="Interview questions tailored to the role."
    )
    cover_letter_points: list[str] = Field(
        description="Truthful points the candidate may use in a cover letter."
    )


# Check AI status
def is_ai_enabled() -> bool:
    """Return whether optional Gemini enhancement is enabled."""
    value = os.getenv("CAREERPILOT_AI_ENABLED", "true")
    return value.strip().lower() in {"1", "true", "yes", "on"}


def get_gemini_client() -> genai.Client:
    """Create a Gemini client from the backend environment."""
    api_key = os.getenv("GEMINI_API_KEY", "").strip()

    # Check API key
    if not api_key:
        raise AIRecommendationError(
            "GEMINI_API_KEY has not been configured in backend/.env."
        )

    return genai.Client(api_key=api_key)


def clean_string_list(value: Any, limit: int = 8) -> list[str]:
    """Return a short, unique list of non-empty strings."""
    if not isinstance(value, list):
        return []

    result: list[str] = []

    for item in value:
        text = str(item).strip()

        if text and text not in result:
            result.append(text)

        if len(result) >= limit:
            break

    return result

# Format skill names
def readable_skills(skills: Any) -> list[str]:
    """Convert internal skill names into presentation-friendly labels."""
    if not isinstance(skills, list):
        return []

    return [
        str(skill).replace("_", " ").title()
        for skill in skills
        if str(skill).strip()
    ]

# Generate fallback guidance
def build_fallback_guidance(
    analysis: dict[str, Any],
) -> dict[str, Any]:
    """
    Generate local guidance when Gemini is disabled or unavailable.

    This ensures the main CV-analysis feature still works without an
    external AI response.
    """
    matched = readable_skills(analysis.get("matched_skills"))
    missing = readable_skills(analysis.get("missing_skills"))

    recommendation = analysis.get("career_recommendation", {})
    career = recommendation.get(
        "recommended_career",
        "the selected career pathway",
    )

    if matched:
        strength_text = ", ".join(matched[:3])
        summary = (
            f"The analysis identified relevant strengths in {strength_text} "
            f"for {career}."
        )
    else:
        summary = (
            f"The current CV has limited verified overlap with {career}. "
            "Further role-specific evidence would strengthen the application."
        )

    if missing:
        summary += (
            " The highest-priority development areas are "
            f"{', '.join(missing[:3])}."
        )

    return {
        "provider": "local-fallback",
        "summary": summary,
        "career_reasoning": (
            f"{career} was selected using the project's weighted comparison "
            "of detected CV skills against predefined career requirements."
        ),
        "strength_highlights": matched[:6],
        "development_advice": [
            f"Complete a practical project that demonstrates {skill}."
            for skill in missing[:6]
        ],
        "interview_questions": [
            "Describe a project that demonstrates your strongest relevant skill.",
            "How would you approach a task involving a skill you are still developing?",
            "Give an example of how you solved a difficult problem.",
            "How do you communicate technical findings to other people?",
        ],
        "cover_letter_points": [
            "Connect a verified skill to a concrete project or responsibility.",
            "Explain why the target role matches your career direction.",
            "Show how you are actively developing any missing role requirements.",
        ],
    }


def build_prompt(
    *,
    cv_text: str,
    job_description: str,
    analysis: dict[str, Any],
) -> str:
    """Create a guarded prompt that preserves algorithmic results."""
    prompt_payload = {
        "cv_text": cv_text[:30_000],
        "job_description": job_description[:20_000],
        "verified_algorithmic_analysis": analysis,
    }

    return f"""
You are the guidance component of CareerPilot AI.

The supplied algorithmic analysis is the source of truth.

Rules:
1. Do not recalculate or change match_score.
2. Do not add skills that are not supported by the CV or verified analysis.
3. Don't add anything that's not on the CV.
4. The skills lists are already confirmed don't question them.
5. Give short, helpful advice.
6. Avoid promising employment outcomes.
7. Write good English.

Produce:
- a short candidate summary;
- reasoning for the verified career recommendation;
- verified strength highlights;
- practical advice for missing skills;
- standard interview-practice questions;
- truthful cover-letter points.

Input data:
{json.dumps(prompt_payload, ensure_ascii=False)}
""".strip()

# Generate AI guidance
def generate_ai_enhancement(
    *,
    cv_text: str,
    job_description: str,
    deterministic_analysis: dict[str, Any],
) -> dict[str, Any]:
    """
    Add Gemini-generated guidance to deterministic analysis.

    The local algorithm remains responsible for all scores and skill lists.
    """
    fallback = build_fallback_guidance(deterministic_analysis)

    if not is_ai_enabled():
        return fallback

    try:
        client = get_gemini_client()
        model = (
            os.getenv("GEMINI_MODEL", DEFAULT_MODEL).strip()
            or DEFAULT_MODEL
        )

        # Send prompt to Gemini
        response = client.models.generate_content(
            model=model,
            contents=build_prompt(
                cv_text=cv_text,
                job_description=job_description,
                analysis=deterministic_analysis,
            ),
            config=types.GenerateContentConfig(
                temperature=0.2,
                response_mime_type="application/json",
                response_schema=CareerGuidance,
            ),
        )

        # Check AI response
        if not response.text:
            raise AIRecommendationError(
                "Gemini returned an empty response."
            )

        # Parse AI output
        guidance = CareerGuidance.model_validate_json(response.text)

        return {
            "provider": "gemini",
            "model": model,
            "summary": guidance.summary.strip(),
            "career_reasoning": guidance.career_reasoning.strip(),
            "strength_highlights": clean_string_list(
                guidance.strength_highlights,
                limit=6,
            ),
            "development_advice": clean_string_list(
                guidance.development_advice,
                limit=6,
            ),
            "interview_questions": clean_string_list(
                guidance.interview_questions,
                limit=8,
            ),
            "cover_letter_points": clean_string_list(
                guidance.cover_letter_points,
                limit=6,
            ),
        }
        
    # Handle AI errors
    except Exception as exc:
        fallback["warning"] = (
            "Gemini guidance was unavailable, so locally generated guidance "
            "was returned instead."
        )
        fallback["error_type"] = type(exc).__name__
        return fallback