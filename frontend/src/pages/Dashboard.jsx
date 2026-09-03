import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

// Key used to save and retrieve the latest CV analysis
const STORAGE_KEY = "careerPilotLatestAnalysis";

function readLatestAnalysis() {
  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return null;
    }

    const parsedValue = JSON.parse(storedValue);

    return parsedValue && typeof parsedValue === "object"
      ? parsedValue
      : null;
  } catch (error) {
    console.error("Unable to read the saved CV analysis:", error);
    return null;
  }
}

function normaliseStringList(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return item.trim();
      }

      if (item && typeof item === "object") {
        return String(
          item.name ??
            item.skill ??
            item.title ??
            item.label ??
            "",
        ).trim();
      }

      return "";
    })
    .filter(Boolean);
}

function getAnalysisData(result) {
  return result?.analysis ?? result?.result ?? result ?? {};
}

// Extracts the job-match score and converts it to a percentage
function getMatchScore(analysis) {
  const possibleScore =
    analysis?.match_score ??
    analysis?.score ??
    analysis?.match_percentage ??
    analysis?.percentage ??
    analysis?.career_recommendation?.career_match_score;

  const numericScore = Number(possibleScore);

  if (!Number.isFinite(numericScore)) {
    return 0;
  }

  if (numericScore > 0 && numericScore <= 1) {
    return numericScore * 100;
  }

  return Math.min(100, Math.max(0, numericScore));
}

// Extracts the suggested career from the analysis 
function getCareerRecommendation(analysis) {
  const recommendation =
    analysis?.career_recommendation ??
    analysis?.recommendation ??
    analysis?.recommended_career;

  if (typeof recommendation === "string") {
    return recommendation.trim();
  }

  if (recommendation && typeof recommendation === "object") {
    return String(
      recommendation.recommended_career ??
        recommendation.career ??
        recommendation.title ??
        "",
    ).trim();
  }

  return "";
}

function formatSkill(skill) {
  return String(skill)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

// Main Dashboard component
function Dashboard() {
  const [latestResult, setLatestResult] = useState(() =>
    readLatestAnalysis(),
  );

  useEffect(() => {
    function refreshDashboard() {
      setLatestResult(readLatestAnalysis());
    }

    function handleStorageChange(event) {
      if (!event.key || event.key === STORAGE_KEY) {
        refreshDashboard();
      }
    }

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

   // get the results from the analysis
  const dashboardData = useMemo(() => {
    if (!latestResult) {
      return null;
    }

    const analysis = getAnalysisData(latestResult);

    const matchedSkills = normaliseStringList(
      analysis?.matched_skills ?? analysis?.matching_skills,
    );

    const missingSkills = normaliseStringList(
      analysis?.missing_skills ?? analysis?.skill_gaps,
    );

    const cvSkills = normaliseStringList(
      analysis?.cv_skills ?? analysis?.detected_skills,
    );

    const matchScore = getMatchScore(analysis);

    const matchLevel =
      analysis?.match_level ??
      analysis?.level ??
      analysis?.match_rating ??
      analysis?.career_recommendation?.career_match_level ??
      "";

    const careerRecommendation = getCareerRecommendation(analysis);

    return {
      matchedSkills,
      missingSkills,
      cvSkills,
      matchScore,
      matchLevel,
      careerRecommendation,
    };
  }, [latestResult]);

  
  return (
    <main className="dashboard-page">
      <section className="dashboard-welcome-card">
        {/* Career overview */}
        <div className="dashboard-welcome-copy">
          <p className="page-eyebrow">Career overview</p>

          <h1>CareerPilot AI Dashboard</h1>

          <p className="dashboard-welcome-description">
            Analyse your CV against a job description, then review your
            latest results and career insights from this dashboard.
          </p>

          <Link className="primary-button" to="/upload-cv">
            Analyse my CV
          </Link>
        </div>

        {!dashboardData ? (
          <div className="dashboard-analysis-placeholder">
            <p className="page-eyebrow">Latest analysis</p>
            <h2>Your CV analysis will appear here</h2>
            <p>
              Complete a CV analysis to display your match score, matched
              skills, missing skills and suggested career direction.
            </p>
          </div>
        ) : (
          <div className="dashboard-latest-analysis">
            <div className="dashboard-analysis-heading">
              <div>
                <p className="page-eyebrow">Latest analysis</p>
                <h2>Your CV analysis</h2>
              </div>

              {dashboardData.matchLevel && (
                <span className="dashboard-match-badge">
                  {dashboardData.matchLevel}
                </span>
              )}
            </div>

               {/* Display the calculated job-match percentage. */}
            <div className="dashboard-score-block">
              <div>
                <span>Job match score</span>
                <strong>{Math.round(dashboardData.matchScore)}%</strong>
              </div>

              <div
                className="dashboard-progress-track"
                role="progressbar"
                aria-label="Job match score"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={Math.round(dashboardData.matchScore)}
              >
                <span
                  className="dashboard-progress-value"
                  style={{ width: `${dashboardData.matchScore}%` }}
                />
              </div>
            </div>

            <div className="dashboard-mini-grid">
              <article>
                <span>Matched skills</span>
                <strong>{dashboardData.matchedSkills.length}</strong>
              </article>

              <article>
                <span>Missing skills</span>
                <strong>{dashboardData.missingSkills.length}</strong>
              </article>

              <article>
                <span>Detected CV skills</span>
                <strong>{dashboardData.cvSkills.length}</strong>
              </article>
            </div>

            {dashboardData.careerRecommendation && (
              <div className="dashboard-career-result">
                <span>Suggested career direction</span>
                <strong>{dashboardData.careerRecommendation}</strong>
              </div>
            )}
          </div>
        )}
      </section>

      {dashboardData && (
        <section className="dashboard-results-section">
          <div className="dashboard-result-panel">
            <div className="dashboard-result-heading">
              <div>
                <p className="page-eyebrow">Strengths</p>
                <h2>Matched skills</h2>
              </div>
              <span>{dashboardData.matchedSkills.length}</span>
            </div>

            {dashboardData.matchedSkills.length > 0 ? (
              <ul className="dashboard-skill-list dashboard-skill-success">
                {dashboardData.matchedSkills.map((skill) => (
                  <li key={`matched-${skill}`}>
                    {formatSkill(skill)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="dashboard-empty-message">
                No matched skills were returned for this analysis.
              </p>
            )}
          </div>

          <div className="dashboard-result-panel">
            <div className="dashboard-result-heading">
              <div>
                <p className="page-eyebrow">Development areas</p>
                <h2>Missing skills</h2>
              </div>
              <span>{dashboardData.missingSkills.length}</span>
            </div>

            {dashboardData.missingSkills.length > 0 ? (
              <ul className="dashboard-skill-list dashboard-skill-warning">
                {dashboardData.missingSkills.map((skill) => (
                  <li key={`missing-${skill}`}>
                    {formatSkill(skill)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="dashboard-empty-message">
                No missing skills were identified.
              </p>
            )}
          </div>
        </section>
      )}

      <style>{`
        .dashboard-page {
          width: 100%;
          min-height: 100%;
          padding: 2rem;
        }

        .dashboard-welcome-card {
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(340px, 0.95fr);
          gap: 2rem;
          align-items: stretch;
          max-width: 1180px;
          margin: 0 auto;
        }

        .dashboard-welcome-copy,
        .dashboard-analysis-placeholder,
        .dashboard-latest-analysis,
        .dashboard-result-panel {
          background: #ffffff;
          border: 1px solid #e3e8f3;
          border-radius: 24px;
          box-shadow: 0 12px 35px rgba(15, 34, 76, 0.06);
        }

        .dashboard-welcome-copy,
        .dashboard-analysis-placeholder,
        .dashboard-latest-analysis {
          padding: 2rem;
          min-height: 420px;
        }

        .dashboard-welcome-copy {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .dashboard-welcome-copy h1 {
          margin: 0.5rem 0 1rem;
          max-width: 680px;
          font-size: clamp(2.4rem, 5vw, 4.6rem);
          line-height: 0.98;
          letter-spacing: -0.045em;
          color: #071633;
        }

        .dashboard-welcome-description {
          max-width: 620px;
          margin: 0 0 1.75rem;
          color: #657087;
          font-size: 1.05rem;
          line-height: 1.75;
        }

        .dashboard-welcome-copy .primary-button {
          align-self: flex-start;
          text-decoration: none;
        }

        .dashboard-analysis-placeholder {
          display: flex;
          flex-direction: column;
          justify-content: center;
          background:
            linear-gradient(
              145deg,
              rgba(239, 244, 255, 0.96),
              rgba(250, 247, 255, 0.96)
            );
        }

        .dashboard-analysis-placeholder h2,
        .dashboard-analysis-heading h2,
        .dashboard-result-heading h2 {
          margin: 0.4rem 0 0;
          color: #071633;
        }

        .dashboard-analysis-placeholder h2 {
          font-size: clamp(1.8rem, 3vw, 2.8rem);
          line-height: 1.12;
        }

        .dashboard-analysis-placeholder p:last-child {
          margin: 1rem 0 0;
          color: #657087;
          line-height: 1.7;
        }

        .dashboard-latest-analysis {
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 1.25rem;
          background:
            linear-gradient(
              145deg,
              rgba(246, 249, 255, 0.98),
              rgba(249, 247, 255, 0.98)
            );
        }

        .dashboard-analysis-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
        }

        .dashboard-analysis-heading h2 {
          font-size: 2rem;
        }

        .dashboard-match-badge {
          border-radius: 999px;
          padding: 0.55rem 0.85rem;
          background: #eef4ff;
          color: #245ec7;
          font-weight: 700;
          font-size: 0.86rem;
        }

        .dashboard-score-block {
          padding: 1.15rem;
          border: 1px solid #dfe6f2;
          border-radius: 18px;
          background: #ffffff;
        }

        .dashboard-score-block > div:first-child {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 0.85rem;
        }

        .dashboard-score-block span {
          color: #657087;
        }

        .dashboard-score-block strong {
          color: #071633;
          font-size: 2rem;
        }

        .dashboard-progress-track {
          width: 100%;
          height: 10px;
          overflow: hidden;
          border-radius: 999px;
          background: #e7eefb;
        }

        .dashboard-progress-value {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #2e6df6, #5d8df8);
        }

        .dashboard-mini-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.8rem;
        }

        .dashboard-mini-grid article {
          padding: 1rem;
          border: 1px solid #dfe6f2;
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.88);
        }

        .dashboard-mini-grid span {
          display: block;
          margin-bottom: 0.35rem;
          color: #657087;
          font-size: 0.84rem;
        }

        .dashboard-mini-grid strong {
          color: #071633;
          font-size: 1.65rem;
        }

        .dashboard-career-result {
          padding: 1rem 1.1rem;
          border-radius: 16px;
          background: #eaf8f0;
        }

        .dashboard-career-result span {
          display: block;
          margin-bottom: 0.25rem;
          color: #567064;
          font-size: 0.84rem;
        }

        .dashboard-career-result strong {
          color: #123b2a;
          font-size: 1.2rem;
        }

        .dashboard-results-section {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 2rem;
          max-width: 1180px;
          margin: 2rem auto 0;
        }

        .dashboard-result-panel {
          padding: 1.7rem;
        }

        .dashboard-result-heading {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 1rem;
          margin-bottom: 1.2rem;
        }

        .dashboard-result-heading > span {
          display: grid;
          width: 2.2rem;
          height: 2.2rem;
          place-items: center;
          border-radius: 999px;
          background: #eef4ff;
          color: #245ec7;
          font-weight: 800;
        }

        .dashboard-skill-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.7rem;
          padding: 0;
          margin: 0;
          list-style: none;
        }

        .dashboard-skill-list li {
          border-radius: 999px;
          padding: 0.65rem 0.85rem;
          font-weight: 700;
          font-size: 0.9rem;
        }

        .dashboard-skill-success li {
          background: #e8f8ee;
          color: #1c6f42;
        }

        .dashboard-skill-warning li {
          background: #fff0df;
          color: #9a4d0d;
        }

        .dashboard-empty-message {
          margin: 0;
          color: #657087;
          line-height: 1.6;
        }

        @media (max-width: 900px) {
          .dashboard-page {
            padding: 1.25rem;
          }

          .dashboard-welcome-card,
          .dashboard-results-section {
            grid-template-columns: 1fr;
          }

          .dashboard-welcome-copy,
          .dashboard-analysis-placeholder,
          .dashboard-latest-analysis {
            min-height: auto;
          }
        }

        @media (max-width: 600px) {
          .dashboard-page {
            padding: 1rem;
          }

          .dashboard-welcome-copy,
          .dashboard-analysis-placeholder,
          .dashboard-latest-analysis,
          .dashboard-result-panel {
            padding: 1.4rem;
            border-radius: 18px;
          }

          .dashboard-mini-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}

export default Dashboard;