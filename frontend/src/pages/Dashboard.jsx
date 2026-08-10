import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

// Local storage key
const STORAGE_KEY = "careerPilotLatestAnalysis";

function normaliseSkillList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((skill) => {
      if (typeof skill === "string") {
        return skill.trim();
      }

      // Cotrols object values
      if (skill && typeof skill === "object") {
        return String(
          skill.name ??
            skill.skill ??
            skill.label ??
            skill.preferred_label ??
            "",
        ).trim();
      }

      return "";
    })
    .filter(Boolean);
}

// Format skill name
function formatSkillName(skill) {
  return skill
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function clampPercentage(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.min(100, Math.max(0, numericValue));
}

// Get saved analysis
function readLatestAnalysis() {
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return null;
    }
    
    // Convert JSON to object
    const parsedValue = JSON.parse(storedValue);

    return parsedValue && typeof parsedValue === "object"
      ? parsedValue
      : null;
  } catch (error) {
    console.error("Unable to read the saved CV analysis:", error);
    return null;
  }
}

// Dashboard component
function Dashboard() {
  const [latestResult, setLatestResult] = useState(() =>
    readLatestAnalysis(),
  );

  // Update dashboard data
  useEffect(() => {
    function refreshDashboard() {
      setLatestResult(readLatestAnalysis());
    }

    // updates storage 
    function handleStorageChange(event) {
      if (!event.key || event.key === STORAGE_KEY) {
        refreshDashboard();
      }
    }

    // Listen for storage changes
    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(
      "careerpilot-analysis-updated",
      refreshDashboard,
    );

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "careerpilot-analysis-updated",
        refreshDashboard,
      );
    };
  }, []);

  const dashboardData = useMemo(() => {
    if (!latestResult) {
      return null;
    }

    // It get analysis results
    const analysis =
      latestResult.analysis &&
      typeof latestResult.analysis === "object"
        ? latestResult.analysis
        : latestResult;

    // It get career recommendation
    const recommendation =
      analysis.career_recommendation &&
      typeof analysis.career_recommendation === "object"
        ? analysis.career_recommendation
        : {};

    const matchedSkills = normaliseSkillList(
      analysis.matched_skills,
    );

    const missingSkills = normaliseSkillList(
      analysis.missing_skills,
    );

    const cvSkills = normaliseSkillList(
      analysis.cv_skills ?? analysis.detected_skills,
    );

    // get required skills
    const requiredSkills = normaliseSkillList(
      analysis.required_skills,
    );

    const matchScore = clampPercentage(
      analysis.match_score ??
        analysis.score ??
        recommendation.career_match_score,
    );

    const recommendedCareer =
      recommendation.recommended_career ??
      analysis.recommended_career ??
      analysis.career ??
      "Not available";

    const matchLevel =
      analysis.match_level ??
      recommendation.career_match_level ??
      "Not available";

    // processed dashboard data
    return {
      filename:
        latestResult.filename ??
        latestResult.file_name ??
        analysis.filename ??
        "Uploaded CV",
      extractedCharacters:
        latestResult.extracted_character_count ??
        latestResult.extracted_characters ??
        analysis.extracted_character_count ??
        null,
      matchedSkills,
      missingSkills,
      cvSkills,
      requiredSkills,
      matchScore,
      matchLevel,
      recommendedCareer,
    };
  }, [latestResult]);

  // Clear saved analysis
  function clearLatestAnalysis() {
    const confirmed = window.confirm(
      "Remove the saved analysis from this dashboard?",
    );

    if (!confirmed) {
      return;
    }

    window.localStorage.removeItem(STORAGE_KEY);
    setLatestResult(null);
  }

  if (!dashboardData) {
    return (
      <main className="dashboard-page">
        <section className="dashboard-empty-state">
          <p className="page-eyebrow">Career overview</p>

          <h1>CareerPilot AI Dashboard</h1>

           {/* User instructions */}
          <p className="dashboard-empty-description">
            Upload your CV and compare it with a job description to
            generate your skills analysis, match score and career
            recommendation.
          </p>

          <Link className="primary-button" to="/upload-cv">
            Upload and analyse a CV
          </Link>
        </section>
      </main>
    );
  }

  const {
    filename,
    extractedCharacters,
    matchedSkills,
    missingSkills,
    cvSkills,
    requiredSkills,
    matchScore,
    matchLevel,
    recommendedCareer,
  } = dashboardData;

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="page-eyebrow">Latest CV analysis</p>
          <h1>CareerPilot AI Dashboard</h1>
          <p>
            Review your latest CV comparison and continue developing
            your career profile.
          </p>
        </div>

        <div className="dashboard-header-actions">
          <Link className="primary-button" to="/upload-cv">
            Analyse another CV
          </Link>

          <button
            className="secondary-button"
            type="button"
            onClick={clearLatestAnalysis}
          >
            Clear results
          </button>
        </div>
      </header>

      <section
        className="dashboard-summary-grid"
        aria-label="Analysis summary"
      >
        <article className="dashboard-summary-card dashboard-score-card">
          <div className="dashboard-card-heading">
            <span>Match score</span>
            <strong>{matchScore.toFixed(1)}%</strong>
          </div>

          {/* Display CV match score */}
          <div
            className="dashboard-progress-track"
            role="progressbar"
            aria-label="CV match score"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={Math.round(matchScore)}
          >
            <span
              className="dashboard-progress-value"
              style={{ width: `${matchScore}%` }}
            />
          </div>

          <p>{matchLevel}</p>
        </article>

        {/* Display matched skills summary */}
        <article className="dashboard-summary-card">
          <span>Matched skills</span>
          <strong>{matchedSkills.length}</strong>
          <p>Skills found in both your CV and the job description.</p>
        </article>

        <article className="dashboard-summary-card">
          <span>Missing skills</span>
          <strong>{missingSkills.length}</strong>
          <p>Requirements that were not clearly detected in your CV.</p>
        </article>

        <article className="dashboard-summary-card">
          <span>Detected CV skills</span>
          <strong>{cvSkills.length}</strong>
          <p>Skills identified from your uploaded document.</p>
        </article>
      </section>

      <section className="dashboard-content-grid">
        <article className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <p className="page-eyebrow">Strengths</p>
              <h2>Matched skills</h2>
            </div>

            <span className="dashboard-count-badge">
              {matchedSkills.length}
            </span>
          </div>

          {/* matched skills */}
          {matchedSkills.length > 0 ? (
            <ul className="skill-chip-list">
              {matchedSkills.map((skill) => (
                <li key={skill} className="skill-chip skill-chip-success">
                  {formatSkillName(skill)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="dashboard-empty-message">
              No matched skills were returned for this analysis.
            </p>
          )}
        </article>

        <article className="dashboard-panel">
          <div className="dashboard-panel-heading">
            <div>
              <p className="page-eyebrow">Development areas</p>
              <h2>Missing skills</h2>
            </div>

            <span className="dashboard-count-badge">
              {missingSkills.length}
            </span>
          </div>

          {missingSkills.length > 0 ? (
            <ul className="skill-chip-list">
              {missingSkills.map((skill) => (
                <li key={skill} className="skill-chip skill-chip-warning">
                  {formatSkillName(skill)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="dashboard-empty-message">
              No missing skills were identified.
            </p>
          )}
        </article>
      </section>

      <section className="dashboard-recommendation-card">
        <div>
          <p className="page-eyebrow">Career recommendation</p>
          <h2>{recommendedCareer}</h2>
        </div>

        <dl className="dashboard-recommendation-details">
          <div>
            <dt>Career match score</dt>
            <dd>{matchScore.toFixed(1)}%</dd>
          </div>

          <div>
            <dt>Match level</dt>
            <dd>{matchLevel}</dd>
          </div>
        </dl>
      </section>

      <section className="dashboard-panel dashboard-details-panel">
        <div className="dashboard-panel-heading">
          <div>
            <p className="page-eyebrow">Analysis details</p>
            <h2>Uploaded document</h2>
          </div>
        </div>

        <dl className="dashboard-file-details">
          <div>
            <dt>Filename</dt>
            <dd>{filename}</dd>
          </div>

          {/* Extracted characters */}
          <div>
            <dt>Extracted characters</dt>
            <dd>
              {Number.isFinite(Number(extractedCharacters))
                ? Number(extractedCharacters).toLocaleString()
                : "Not available"}
            </dd>
          </div>

          <div>
            <dt>Required skills detected</dt>
            <dd>{requiredSkills.length}</dd>
          </div>

          <div>
            <dt>CV skills detected</dt>
            <dd>{cvSkills.length}</dd>
          </div>
        </dl>

        {/* Display detected skills */}
        {cvSkills.length > 0 && (
          <div className="dashboard-detected-skills">
            <h3>Detected skills</h3>

            <ul className="skill-chip-list">
              {cvSkills.map((skill) => (
                <li key={skill} className="skill-chip">
                  {formatSkillName(skill)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <nav
        className="dashboard-footer-actions"
        aria-label="Dashboard actions"
      >
        <Link className="primary-button" to="/upload-cv">
          Analyse another CV
        </Link>

        <Link className="secondary-button" to="/job-comparison">
          View job comparison
        </Link>

        <Link className="secondary-button" to="/learning-roadmap">
          Open learning roadmap
        </Link>
      </nav>
    </main>
  );
}

export default Dashboard;