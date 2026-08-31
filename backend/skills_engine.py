import re
from typing import Dict, List, Set, Tuple

# Store supported skills
SKILL_LIBRARY: Dict[str, Dict[str, object]] = {
    "python": {
        "keywords": ["python", "fastapi", "flask", "django"],
        "category": "backend",
        "weight": 5,
    },
    "javascript": {
        "keywords": ["javascript", "js", "node", "node.js"],
        "category": "frontend",
        "weight": 4,
    },
    "react": {
        "keywords": ["react", "react.js", "reactjs"],
        "category": "frontend",
        "weight": 4,
    },
    "html": {
        "keywords": ["html", "html5"],
        "category": "frontend",
        "weight": 3,
    },

    # CSS and styling 
    "css": {
        "keywords": ["css", "bootstrap", "tailwind"],
        "category": "frontend",
        "weight": 3,
    },
    # Database
    "sql": {
        "keywords": ["sql", "mysql", "sqlite", "sql server", "postgresql"],
        "category": "database",
        "weight": 5,
    },
    "database_design": {
        "keywords": ["database design", "relational database", "tables", "queries"],
        "category": "database",
        "weight": 4,
    },

    # backend API skills
    "api_development": {
        "keywords": ["api", "rest api", "backend api", "server"],
        "category": "backend",
        "weight": 5,
    },
    "git": {
        "keywords": ["git", "github", "version control"],
        "category": "tools",
        "weight": 3,
    },
    "testing": {
        "keywords": ["testing", "unit testing", "debugging", "test cases"],
        "category": "quality",
        "weight": 4,
    },
    "security": {
        "keywords": ["authentication", "authorization", "password", "jwt", "security"],
        "category": "security",
        "weight": 4,
    },

    # Ai 
    "machine_learning": {
        "keywords": ["machine learning", "ml", "ai", "artificial intelligence"],
        "category": "ai",
        "weight": 5,
    },
    "data_analysis": {
        "keywords": ["data analysis", "analytics", "data processing", "pandas"],
        "category": "data",
        "weight": 4,
    },
    "communication": {
        "keywords": ["communication", "teamwork", "presentation"],
        "category": "soft_skills",
        "weight": 2,
    },
    "problem_solving": {
        "keywords": ["problem solving", "critical thinking", "troubleshooting"],
        "category": "soft_skills",
        "weight": 3,
    },
}

# Stores skills required for the profile
CAREER_PROFILES: Dict[str, Set[str]] = {
    "Backend Developer": {
        "python", "sql", "api_development", "database_design", "git", "testing", "security"
    },
    "Frontend Developer": {
        "javascript", "react", "html", "css", "git", "testing"
    },
    "Full Stack Developer": {
        "python", "javascript", "react", "html", "css", "sql", "api_development", "database_design", "git"
    },
    "Data Analyst": {
        "python", "sql", "data_analysis", "database_design", "problem_solving"
    },
    "AI / Machine Learning Assistant": {
        "python", "machine_learning", "data_analysis", "sql", "problem_solving"
    },
    "Software Engineer": {
        "python", "javascript", "sql", "git", "testing", "problem_solving", "api_development"
    },
}

# Cleans text before skill extraction 
def clean_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9+#.\s]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()

# Extract skills from text
def extract_skills(text: str) -> Set[str]:
    cleaned_text = clean_text(text)
    found_skills: Set[str] = set()

    for skill_name, data in SKILL_LIBRARY.items():
        keywords = data["keywords"]

        for keyword in keywords:
            pattern = r"\b" + re.escape(str(keyword).lower()) + r"\b"

            if re.search(pattern, cleaned_text):
                found_skills.add(skill_name)
                break

    return found_skills


# It calculate weight skills
def get_skill_weight(skill: str) -> int:
    skill_data = SKILL_LIBRARY.get(skill)

    if not skill_data:
        return 1

    return int(skill_data["weight"])

# Calculate the weight of match score
def calculate_weighted_match_score(
    cv_skills: Set[str],
    required_skills: Set[str]
) -> float:
    if not required_skills:
        return 0.0

    total_required_weight = sum(get_skill_weight(skill) for skill in required_skills)
    matched_weight = sum(
        get_skill_weight(skill)
        for skill in required_skills
        if skill in cv_skills
    )

    if total_required_weight == 0:
        return 0.0

    return round((matched_weight / total_required_weight) * 100, 2)


# Classify match score
def classify_match(score: float) -> str:
    if score >= 80:
        return "Strong match"
    if score >= 60:
        return "Good match"
    if score >= 40:
        return "Partial match"
    return "Low match"

# Rank missing skills by priority
def get_missing_skill_priority(missing_skills: List[str]) -> List[Dict[str, object]]:
    priority_list = []

    for skill in missing_skills:
        priority_list.append(
            {
                "skill": skill,
                "category": SKILL_LIBRARY[skill]["category"],
                "priority_weight": get_skill_weight(skill),
            }
        )
    
    # Sort by priority
    return sorted(
        priority_list,
        key=lambda item: item["priority_weight"],
        reverse=True
    )


def recommend_career(cv_skills: Set[str]) -> Dict[str, object]:
    career_results = {}

    # Compare each career profile
    for career, required_profile_skills in CAREER_PROFILES.items():
        score = calculate_weighted_match_score(cv_skills, required_profile_skills)
        matched = sorted(cv_skills.intersection(required_profile_skills))
        missing = sorted(required_profile_skills.difference(cv_skills))

        # Save career result
        career_results[career] = {
            "score": score,
            "matched_skills": matched,
            "missing_skills": missing,
            "match_level": classify_match(score),
        }

    best_career = max(
        career_results,
        key=lambda career_name: career_results[career_name]["score"]
    )

    return {
        "recommended_career": best_career,
        "career_match_score": career_results[best_career]["score"],
        "career_match_level": career_results[best_career]["match_level"],
        "all_career_scores": career_results,
    }


def create_learning_roadmap(missing_skills: List[str]) -> List[Dict[str, str]]:
    roadmap = []

    for skill in missing_skills:
        readable_skill = skill.replace("_", " ").title()

        roadmap.append(
            {
                "skill": readable_skill,
                "stage_1": f"Learn the basic concepts of {readable_skill}.",
                "stage_2": f"Build a small practical task using {readable_skill}.",
                "stage_3": f"Add evidence of {readable_skill} to your CV or portfolio.",
            }
        )
    # Adds interview preparations 
    if not roadmap:
        roadmap.append(
            {
                "skill": "Interview Preparation",
                "stage_1": "Review your CV and prepare examples of your project work.",
                "stage_2": "Practise explaining your technical decisions clearly.",
                "stage_3": "Prepare answers for common job interview questions.",
            }
        )

    return roadmap


def calculate_skill_category_summary(skills: Set[str]) -> Dict[str, int]:
    summary: Dict[str, int] = {}

    for skill in skills:
        category = str(SKILL_LIBRARY[skill]["category"])
        summary[category] = summary.get(category, 0) + 1

    return summary

# Analyse CV against job description
def analyse_cv_against_job(
    cv_text: str,
    job_description: str,
    required_skills_override: Set[str] | None = None,
    esco_occupation: Dict[str, object] | None = None,
    esco_skill_records: List[Dict[str, str]] | None = None,
) -> Dict[str, object]:
    cv_skills = extract_skills(cv_text)

    # When ESCO skills are supplied by the backend, they become the source of
    # required skills. Otherwise, fall back to extracting skills directly from
    # the job description.
    required_skills = (
        set(required_skills_override)
        if required_skills_override
        else extract_skills(job_description)
    )

    matched_skills = sorted(cv_skills.intersection(required_skills))
    missing_skills = sorted(required_skills.difference(cv_skills))

    match_score = calculate_weighted_match_score(cv_skills, required_skills)
    match_level = classify_match(match_score)

    career_recommendation = recommend_career(cv_skills)
    missing_skill_priority = get_missing_skill_priority(missing_skills)
    roadmap = create_learning_roadmap(missing_skills)

    # returns analysis
    return {
        "cv_skills": sorted(cv_skills),
        "required_skills": sorted(required_skills),
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "missing_skill_priority": missing_skill_priority,
        "match_score": match_score,
        "match_level": match_level,
        "cv_skill_categories": calculate_skill_category_summary(cv_skills),
        "job_skill_categories": calculate_skill_category_summary(required_skills),
        "career_recommendation": career_recommendation,
        "learning_roadmap": roadmap,
        "algorithm_explanation": (
            "The system extracts recognised skills from the CV and job description, "
            "compares them using weighted skill importance, calculates a job match "
            "score, ranks missing skills by priority, recommends the closest career "
            "profile, and generates a learning roadmap."
        ),
    }