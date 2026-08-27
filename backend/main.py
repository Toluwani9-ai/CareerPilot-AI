import os
from typing import Annotated

# tools for API 
from fastapi import (
    FastAPI,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
# connection between backend and frontend 
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field, field_validator

from cv_parser import extract_text_from_pdf
from esco_repository import esco_repository

# Connection to the Gemini AI
from gemini_service import (
    GeminiConfigurationError,
    GeminiGenerationError,
    generate_career_guidance,
)

from skills_engine import analyse_cv_against_job


MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024
ALLOWED_PDF_TYPES = {"application/pdf"}

# Create FastAPI app
app = FastAPI(
    title="CareerPilot AI",
    version="1.1.0",
    description=(
        "A career-guidance backend that extracts CV text, detects skills, "
        "compares CV skills with job requirements, calculates weighted match "
        "scores, identifies missing skills and uses ESCO occupation data to "
        "support career recommendations."
    ),
    contact={
        "name": "CareerPilot AI Project",
    },
    license_info={
        "name": "Educational project",
    },
)


DEFAULT_FRONTEND_ORIGINS = (
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:5176",
    "http://127.0.0.1:5176",
    "http://localhost:5177",
    "http://127.0.0.1:5177",
)


# Get allowed frontend origins
def get_allowed_origins() -> list[str]:
    """
    Return the frontend origins permitted to call this API.

    Set CAREERPILOT_ALLOWED_ORIGINS to a comma-separated list in production.
    When it is not set, common local Vite development addresses are allowed.
    """
    configured_origins = os.getenv("CAREERPILOT_ALLOWED_ORIGINS", "").strip()

    if not configured_origins:
        return list(DEFAULT_FRONTEND_ORIGINS)

    return [
        origin.strip().rstrip("/")
        for origin in configured_origins.split(",")
        if origin.strip()
    ]

# Connection from the  frontend to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


class SkillAnalysisRequest(BaseModel):
    """Request data used to compare CV text with a job description."""

    model_config = ConfigDict(
        str_strip_whitespace=True,
        json_schema_extra={
            "example": {
                "cv_text": (
                    "I have experience with Python, FastAPI, SQL, Git, "
                    "HTML and database development."
                ),
                "job_description": (
                    "We require a backend developer with Python, FastAPI, "
                    "SQL, REST API development, Git, testing and security."
                ),
            }
        },
    )

    cv_text: str = Field(
        ...,
        min_length=10,
        max_length=100_000,
        description="Text extracted from, or copied from, the user's CV.",
    )
    job_description: str = Field(
        ...,
        min_length=10,
        max_length=50_000,
        description="Description of the job the user wants to analyse.",
    )

    @field_validator("cv_text", "job_description")
    @classmethod
    def reject_blank_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("The supplied text cannot be empty.")
        return value


class CVJobAnalysisRequest(SkillAnalysisRequest):
    """Request model retained for the uploaded-CV analysis route."""


class HealthResponse(BaseModel):
    application: str
    message: str
    status: str
    version: str
    data_source: str


def perform_analysis(
    cv_text: str,
    job_description: str,
    include_ai: bool = True,
) -> dict:
    """
    Run deterministic CV analysis and optionally attach Gemini guidance.

    Deterministic skill matching remains the source of truth. If Gemini is
    disabled, misconfigured or temporarily unavailable, the normal analysis
    is still returned together with a non-fatal AI error message.
    """
    try:
        result = analyse_cv_against_job(
            cv_text=cv_text,
            job_description=job_description,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The skill analysis could not be completed.",
        ) from exc

    if not isinstance(result, dict):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="The analysis engine returned an invalid result.",
        )

    ai_guidance = None
    ai_error = None

     # Get skills from the CV analysis
    if include_ai:
        detected_skills = result.get(
            "cv_skills",
            result.get("detected_skills", []),
        )
        matched_skills = result.get(
            "matched_skills",
            result.get("matching_skills", []),
        )
        missing_skills = result.get(
            "missing_skills",
            result.get("skill_gaps", []),
        )
         
         # generate the interview questions.
        try:
            ai_guidance = generate_career_guidance(
                cv_text=cv_text,
                job_description=job_description,
                detected_skills=detected_skills,
                matched_skills=matched_skills,
                missing_skills=missing_skills,
            )
        except (GeminiConfigurationError, GeminiGenerationError) as exc:
            ai_error = str(exc)
        except Exception:
            ai_error = "Gemini guidance could not be generated."

    result["ai_guidance"] = ai_guidance
    result["ai_error"] = ai_error

    return result


async def read_and_validate_pdf(file: UploadFile) -> bytes:
    """Validate an uploaded PDF before sending it to the CV parser."""
    filename = file.filename or "uploaded-cv.pdf"
    content_type = file.content_type or ""

    has_pdf_extension = filename.lower().endswith(".pdf")
    has_pdf_content_type = content_type in ALLOWED_PDF_TYPES

    if not has_pdf_extension or not has_pdf_content_type:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only PDF CV files are accepted.",
        )

    file_bytes = await file.read()

    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded PDF is empty.",
        )

    if len(file_bytes) > MAX_PDF_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="The PDF must not exceed 5 MB.",
        )

    # A normal PDF begins with the %PDF file signature.
    if not file_bytes.startswith(b"%PDF"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The uploaded file does not appear to be a valid PDF.",
        )

    return file_bytes


@app.get(
    "/",
    response_model=HealthResponse,
    tags=["System"],
    summary="Check backend status",
)
def home() -> HealthResponse:
    """Confirm that the CareerPilot AI backend is available."""
    return HealthResponse(
        application="CareerPilot AI",
        message="CareerPilot AI backend is running successfully.",
        status="OK",
        version=app.version,
        data_source="ESCO classification of the European Commission",
    )

#checks if the backend is running
@app.get(
    "/health",
    response_model=HealthResponse,
    tags=["System"],
    summary="Run a health check",
)
def health_check() -> HealthResponse:
    """Provide a dedicated health-check endpoint."""
    return home()

# Receive CV and job description
@app.post(
    "/analyse-skills",
    tags=["Skill Analysis"],
    summary="Analyse CV skills against a job description",
)
def analyse_skills(request: SkillAnalysisRequest) -> dict:
    """
    Extract recognised skills from the two supplied texts and return:

    - CV skills;
    - required job skills;
    - matched and missing skills;
    - weighted job-match score;
    - match classification;
    - career recommendations;
    - missing-skill priorities;
    - learning roadmap.
    """
    # Analyze CV and job description
    return perform_analysis(
        cv_text=request.cv_text,
        job_description=request.job_description,
    )

# it receives the CV  sent from the frontend for processing.
@app.post(
    "/upload-cv",
    tags=["CV Processing"],
    summary="Extract text from a PDF CV",
)
async def upload_cv(
    file: Annotated[
        UploadFile,
        File(description="A PDF CV with a maximum size of 5 MB."),
    ],
) -> dict:
    """Validate a PDF and extract its text using the project CV parser."""
    file_bytes = await read_and_validate_pdf(file)

    try:
        extracted_text = extract_text_from_pdf(file_bytes)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Text could not be extracted from the uploaded PDF.",
        ) from exc
    finally:
        await file.close()

    if not extracted_text or not extracted_text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "No readable text was found. The PDF may be scanned, "
                "image-based, protected or corrupted."
            ),
        )

    # Return extracted PDF data
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "character_count": len(extracted_text),
        "extracted_text": extracted_text,
    }

# Analyze extracted CV text
@app.post(
    "/analyse-uploaded-cv",
    tags=["Skill Analysis"],
    summary="Analyse previously extracted CV text",
)
def analyse_uploaded_cv(request: CVJobAnalysisRequest) -> dict:
    """
    Analyse CV text that has already been obtained from the upload endpoint.

    This route is retained separately so a frontend may first display and allow
    the user to review extracted CV text before submitting it for analysis.
    """
    # receives the analysis result
    return perform_analysis(
        cv_text=request.cv_text,
        job_description=request.job_description,
    )


@app.post(
    "/upload-and-analyse-cv",
    tags=["CV Processing"],
    summary="Upload a PDF CV and analyse it in one request",
)


async def upload_and_analyse_cv(
    file: Annotated[
        UploadFile,
        File(description="A PDF CV with a maximum size of 5 MB."),
    ],
    job_description: Annotated[
        str,
        Form(
            min_length=10,
            max_length=50_000,
            description="The job description used for comparison.",
        ),
    ],
) -> dict:
    """
    Upload a PDF, extract its text and immediately run the skill-matching
    algorithm against the supplied job description.
    """
    file_bytes = await read_and_validate_pdf(file)

    try:
        cv_text = extract_text_from_pdf(file_bytes)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Text could not be extracted from the uploaded PDF.",
        ) from exc
    finally:
        await file.close()

    if not cv_text or not cv_text.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="No readable text was found in the uploaded PDF.",
        )

    # Run CV analysis
    analysis = perform_analysis(
        cv_text=cv_text,
        job_description=job_description,
    )

    return {
        "filename": file.filename,
        "extracted_character_count": len(cv_text),
        "analysis": analysis,
    }

# Get ESCO statistics
@app.get(
    "/esco/statistics",
    tags=["ESCO"],
    summary="Get ESCO dataset statistics",
)
def get_esco_statistics() -> dict:
    """Return statistics for the ESCO data loaded by the repository."""
    try:
        return esco_repository.get_statistics()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The ESCO dataset is currently unavailable.",
        ) from exc

# Search ESCO occupations
@app.get(
    "/esco/occupations/search",
    tags=["ESCO"],
    summary="Search ESCO occupations",
)
def search_esco_occupations(
    query: Annotated[
        str,
        Query(
            min_length=2,
            max_length=100,
            description=(
                "An occupation title or keyword, such as software developer."
            ),
        ),
    ],
    limit: Annotated[
        int,
        Query(
            ge=1,
            le=50,
            description="Maximum number of matching occupations to return.",
        ),
    ] = 10,
) -> dict:
    """Search occupation titles loaded from the ESCO classification."""
    try:
        results = esco_repository.search_occupations(
            query=query.strip(),
            limit=limit,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The ESCO occupation search could not be completed.",
        ) from exc

    return {
        "query": query.strip(),
        "result_count": len(results),
        "results": results,
    }


@app.get(
    "/esco/occupation-skills",
    tags=["ESCO"],
    summary="Get skills associated with an ESCO occupation",
)
def get_esco_occupation_skills(
    occupation_uri: Annotated[
        str,
        Query(
            min_length=10,
            description="The complete ESCO URI of the selected occupation.",
        ),
    ],
    relation_type: Annotated[
        str | None,
        Query(
            description=(
                "Optional skill relation filter: essential or optional."
            ),
        ),
    ] = None,
) -> dict:
    """
    Retrieve the essential and optional skills linked to an ESCO occupation.

    A query parameter is used for the occupation URI because ESCO identifiers
    contain several forward-slash characters.
    """
    normalised_relation = None

    if relation_type is not None:
        normalised_relation = relation_type.strip().lower()

        if normalised_relation not in {"essential", "optional"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "relation_type must be either 'essential' or 'optional'."
                ),
            )
    
    # Get occupation skills
    try:
        skills = esco_repository.get_occupation_skills(
            occupation_uri=occupation_uri.strip(),
            relation_type=normalised_relation,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="The ESCO occupation skills could not be retrieved.",
        ) from exc

    if not skills:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "No ESCO skills were found for the supplied occupation URI."
            ),
        )

    essential_count = sum(
        str(skill.get("relation_type", "")).lower() == "essential"
        for skill in skills
    )
    optional_count = sum(
        str(skill.get("relation_type", "")).lower() == "optional"
        for skill in skills
    )
    
    # Return occupation skills
    return {
        "occupation_uri": occupation_uri.strip(),
        "relation_filter": normalised_relation,
        "total_skills": len(skills),
        "essential_skills": essential_count,
        "optional_skills": optional_count,
        "skills": skills,
        "data_source_acknowledgement": (
            "This service uses the ESCO classification of the "
            "European Commission."
        ),
    }