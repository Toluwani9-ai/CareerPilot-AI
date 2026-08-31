import { useMemo, useState } from "react";
import { Link } from "react-router-dom";


// Storage keys
const STORAGE_KEYS = [
  "careerPilotLatestAnalysis",
  "careerPilotAnalysis",
  "latestCVAnalysis",
  "cvAnalysisResult",
  "analysisResult",
];

// Safely parse JSON 
function safelyParseJSON(value) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}


// Scan localStorage with the defined keys
function readStoredAnalysis() {
  for (const key of STORAGE_KEYS) {
    const storedValue = window.localStorage.getItem(key);
    const parsedValue = safelyParseJSON(storedValue);

    if (parsedValue && typeof parsedValue === "object") {
      return {
        storageKey: key,
        data: parsedValue,
      };
    }
  }

  return {
    storageKey: null,
    data: null,
  };
}

function ensureArray(value) {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") {
          return item.trim();
        }

        if (item && typeof item === "object") {
          return String(
            item.name ??
              item.skill ??
              item.label ??
              item.title ??
              item.value ??
              "",
          ).trim();
        }

        return String(item).trim();
      })
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,;\n|]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "object") {
    return Object.keys(value).filter(Boolean);
  }

  return [];
}

function uniqueSkills(skills) {
  const seenSkills = new Set();

  return skills.filter((skill) => {
    const normalisedSkill = skill.toLowerCase();

    if (seenSkills.has(normalisedSkill)) {
      return false;
    }

    seenSkills.add(normalisedSkill);
    return true;
  });
}

// Clean up skill strings
function formatSkill(skill) {
  return skill
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normalisePercentage(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return 0;
  }

  const percentage = numericValue <= 1 ? numericValue * 100 : numericValue;

  return Math.min(Math.round(percentage * 100) / 100, 100);
}

function formatPercentage(value) {
  const percentage = normalisePercentage(value);

  return Number.isInteger(percentage)
    ? `${percentage}%`
    : `${percentage.toFixed(2)}%`;
}

// Provide a descriptive match level
function deriveMatchLevel(score, suppliedLevel) {
  if (
    typeof suppliedLevel === "string" &&
    suppliedLevel.trim().length > 0
  ) {
    return suppliedLevel.trim();
  }

  const percentage = normalisePercentage(score);

  if (percentage >= 75) {
    return "Excellent match";
  }

  if (percentage >= 50) {
    return "Good match";
  }

  if (percentage >= 25) {
    return "Moderate match";
  }

  return "Low match";
}

function getMatchVariant(score) {
  const percentage = normalisePercentage(score);

  if (percentage >= 75) {
    return "excellent";
  }

  if (percentage >= 50) {
    return "good";
  }

  if (percentage >= 25) {
    return "moderate";
  }

  return "low";
}

// Extract and standardise the analysis data 
function normaliseAnalysis(savedResult) {
  if (!savedResult || typeof savedResult !== "object") {
    return null;
  }

  const responseRoot =
    savedResult.result ??
    savedResult.response ??
    savedResult.payload ??
    savedResult.data ??
    savedResult;

  const analysis =
    responseRoot.analysis ??
    responseRoot.cv_analysis ??
    responseRoot.skill_analysis ??
    responseRoot;

  const recommendation =
    analysis.career_recommendation ??
    analysis.careerRecommendation ??
    responseRoot.career_recommendation ??
    responseRoot.careerRecommendation ??
    {};

  const detectedSkills = uniqueSkills(
    ensureArray(
      analysis.cv_skills ??
        analysis.cvSkills ??
        analysis.detected_skills ??
        analysis.detectedSkills ??
        responseRoot.cv_skills,
    ),
  );

  const requiredSkills = uniqueSkills(
    ensureArray(
      analysis.required_skills ??
        analysis.requiredSkills ??
        analysis.job_skills ??
        analysis.jobSkills,
    ),
  );

  const matchedSkills = uniqueSkills(
    ensureArray(
      analysis.matched_skills ??
        analysis.matchedSkills ??
        analysis.matches,
    ),
  );

  const missingSkills = uniqueSkills(
    ensureArray(
      analysis.missing_skills ??
        analysis.missingSkills ??
        analysis.skill_gaps ??
        analysis.skillGaps,
    ),
  );

  const rawMatchScore =
    analysis.match_score ??
    analysis.matchScore ??
    analysis.score ??
    responseRoot.match_score ??
    0;

  const careerScore =
    recommendation.career_match_score ??
    recommendation.careerMatchScore ??
    recommendation.score ??
    rawMatchScore;

  const recommendedCareer =
    recommendation.recommended_career ??
    recommendation.recommendedCareer ??
    recommendation.career ??
    recommendation.title ??
    "No career recommendation returned";

  const filename =
    responseRoot.filename ??
    responseRoot.file_name ??
    responseRoot.fileName ??
    savedResult.filename ??
    "Uploaded CV";

  const extractedCharacters =
    responseRoot.extracted_character_count ??
    responseRoot.extracted_characters ??
    responseRoot.extractedCharacters ??
    responseRoot.character_count ??
    null;

  const jobDescription =
    responseRoot.job_description ??
    responseRoot.jobDescription ??
    savedResult.job_description ??
    savedResult.jobDescription ??
    "";

  // Return a consistent and clean structure
  return {
    filename,
    extractedCharacters,
    jobDescription,
    detectedSkills,
    requiredSkills,
    matchedSkills,
    missingSkills,
    matchScore: normalisePercentage(rawMatchScore),
    matchLevel: deriveMatchLevel(
      rawMatchScore,
      analysis.match_level ??
        analysis.matchLevel ??
        responseRoot.match_level,
    ),
    recommendedCareer,
    careerScore: normalisePercentage(careerScore),
    careerMatchLevel: deriveMatchLevel(
      careerScore,
      recommendation.career_match_level ??
        recommendation.careerMatchLevel ??
        recommendation.match_level,
    ),
  };
}

function ComparisonStat({ label, value, description }) {
  return (
    <article className="job-comparison-stat">
      <p className="job-comparison-stat-label">{label}</p>
      <strong className="job-comparison-stat-value">{value}</strong>
      <p className="job-comparison-stat-description">{description}</p>
    </article>
  );
}

function SkillPanel({
  title,
  description,
  skills,
  emptyMessage,
  variant = "neutral",
}) {
  return (
    <article className={`job-skill-panel job-skill-panel--${variant}`}>
      <div className="job-skill-panel-heading">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <span className="job-skill-count" aria-label={`${skills.length} skills`}>
          {skills.length}
        </span>
      </div>

      {skills.length > 0 ? (
        <ul className="job-skill-list">
          {skills.map((skill) => (
            <li key={`${title}-${skill}`}>{formatSkill(skill)}</li>
          ))}
        </ul>
      ) : (
        <p className="job-skill-empty">{emptyMessage}</p>
      )}
    </article>
  );
}

// UI displayed when no comparison
function EmptyComparison() {
  return (
    <main className="job-comparison-page">
      <section className="job-comparison-empty" aria-labelledby="empty-title">
        <div className="job-comparison-empty-icon" aria-hidden="true">
          !
        </div>

        <p className="job-comparison-eyebrow">No saved analysis</p>

        <h1 id="empty-title">Complete a CV analysis first</h1>

        <p>
          Job comparison information will appear here after you upload a PDF CV
          and compare it with a complete job description.
        </p>

        <div className="job-comparison-empty-actions">
          <Link className="job-primary-button" to="/upload-cv">
            Analyse a CV
          </Link>

          <Link className="job-secondary-button" to="/dashboard">
            Return to dashboard
          </Link>
        </div>
      </section>

      <JobComparisonStyles />
    </main>
  );
}

// Component that injects all page-specific CSS
function JobComparisonStyles() {
  return (
    <style>{`
      .job-comparison-page {
        min-height: 100vh;
        padding: clamp(24px, 5vw, 72px);
        color: #111a34;
        background:
          radial-gradient(circle at 50% 0%, rgba(74, 133, 255, 0.16), transparent 38%),
          linear-gradient(135deg, #f8f7ff 0%, #eef6ff 52%, #f8f5ff 100%);
      }

      .job-comparison-shell {
        width: min(1320px, 100%);
        margin: 0 auto;
      }

      .job-comparison-topbar {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        align-items: center;
        margin-bottom: 48px;
      }

      .job-comparison-back,
      .job-comparison-brand {
        color: #111a34;
        font-weight: 700;
        text-decoration: none;
      }

      .job-comparison-back {
        display: inline-flex;
        gap: 10px;
        align-items: center;
      }

      .job-comparison-brand {
        color: #3173ed;
        font-size: 0.78rem;
        letter-spacing: 0.2em;
        text-transform: uppercase;
      }

      .job-comparison-header {
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
        gap: clamp(32px, 7vw, 96px);
        align-items: end;
        margin-bottom: 42px;
      }

      .job-comparison-eyebrow {
        margin: 0 0 18px;
        color: #3173ed;
        font-size: 0.8rem;
        font-weight: 800;
        letter-spacing: 0.2em;
        text-transform: uppercase;
      }

      .job-comparison-header h1,
      .job-comparison-empty h1 {
        margin: 0;
        font-size: clamp(2.8rem, 6vw, 5.8rem);
        line-height: 0.95;
        letter-spacing: -0.065em;
      }

      .job-comparison-introduction {
        margin: 0;
        color: #637087;
        font-size: clamp(1rem, 1.7vw, 1.3rem);
        line-height: 1.75;
      }

      .job-comparison-card,
      .job-comparison-empty {
        border: 1px solid rgba(17, 26, 52, 0.12);
        border-radius: 30px;
        background: rgba(255, 255, 255, 0.94);
        box-shadow: 0 24px 70px rgba(45, 61, 104, 0.1);
      }

      .job-comparison-card {
        padding: clamp(24px, 4vw, 54px);
      }

      .job-comparison-summary {
        display: grid;
        grid-template-columns: minmax(240px, 1.2fr) repeat(3, minmax(170px, 1fr));
        gap: 18px;
      }

      .job-match-card,
      .job-comparison-stat,
      .job-skill-panel,
      .job-career-card,
      .job-description-card,
      .job-document-card {
        border: 1px solid rgba(17, 26, 52, 0.12);
        border-radius: 22px;
        background: #ffffff;
      }

      .job-match-card,
      .job-comparison-stat {
        padding: 26px;
      }

      .job-match-label,
      .job-comparison-stat-label,
      .job-document-label {
        margin: 0 0 10px;
        color: #657187;
        font-size: 0.76rem;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }

      .job-match-number {
        display: block;
        margin-bottom: 18px;
        font-size: clamp(2.4rem, 5vw, 3.6rem);
        line-height: 1;
      }

      .job-match-track,
      .job-career-track {
        overflow: hidden;
        height: 10px;
        border-radius: 999px;
        background: #e6edf8;
      }

      .job-match-fill,
      .job-career-fill {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #2b6fec, #56a4ff);
      }

      .job-match-level {
        display: inline-flex;
        margin: 18px 0 0;
        padding: 8px 13px;
        border-radius: 999px;
        font-size: 0.85rem;
        font-weight: 800;
        background: #e8f1ff;
        color: #174caa;
      }

      .job-match-level--excellent {
        background: #e5f8ec;
        color: #14743a;
      }

      .job-match-level--good {
        background: #eaf7f5;
        color: #0f7369;
      }

      .job-match-level--moderate {
        background: #fff4d8;
        color: #875b00;
      }

      .job-match-level--low {
        background: #e8f1ff;
        color: #174caa;
      }

      .job-comparison-stat-value {
        display: block;
        margin: 7px 0 14px;
        font-size: 2.4rem;
      }

      .job-comparison-stat-description,
      .job-skill-panel-heading p,
      .job-skill-empty,
      .job-career-copy p,
      .job-description-card p,
      .job-document-value {
        margin: 0;
        color: #68758b;
        line-height: 1.6;
      }

      .job-comparison-separator {
        height: 1px;
        margin: 34px 0;
        background: rgba(17, 26, 52, 0.1);
      }

      .job-comparison-section-heading {
        margin-bottom: 22px;
      }

      .job-comparison-section-heading h2 {
        margin: 0 0 8px;
        font-size: clamp(1.7rem, 3vw, 2.4rem);
        letter-spacing: -0.035em;
      }

      .job-comparison-section-heading p {
        margin: 0;
        color: #68758b;
      }

      .job-skill-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 20px;
      }

      .job-skill-panel {
        padding: 26px;
      }

      .job-skill-panel--matched {
        background: linear-gradient(135deg, #ffffff, #f0fbf5);
      }

      .job-skill-panel--missing {
        background: linear-gradient(135deg, #ffffff, #fff7f3);
      }

      .job-skill-panel-heading {
        display: flex;
        justify-content: space-between;
        gap: 18px;
        align-items: flex-start;
      }

      .job-skill-panel-heading h2 {
        margin: 0 0 8px;
        font-size: 1.25rem;
      }

      .job-skill-count {
        display: grid;
        flex: 0 0 auto;
        width: 42px;
        height: 42px;
        place-items: center;
        border-radius: 50%;
        background: #edf4ff;
        color: #2467dc;
        font-weight: 800;
      }

      .job-skill-list {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin: 24px 0 0;
        padding: 0;
        list-style: none;
      }

      .job-skill-list li {
        padding: 9px 13px;
        border-radius: 999px;
        background: #eef4fc;
        color: #23344e;
        font-size: 0.9rem;
        font-weight: 700;
      }

      .job-skill-empty {
        margin-top: 24px;
      }

      .job-career-card {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(220px, 0.42fr);
        gap: 32px;
        align-items: center;
        margin-top: 28px;
        padding: clamp(26px, 4vw, 42px);
        background:
          radial-gradient(circle at 100% 0%, rgba(68, 130, 255, 0.17), transparent 46%),
          linear-gradient(135deg, #faf7ff, #eef8ff);
      }

      .job-career-copy h2 {
        margin: 8px 0 14px;
        font-size: clamp(2rem, 4vw, 3.3rem);
        letter-spacing: -0.045em;
      }

      .job-career-score {
        padding: 24px;
        border: 1px solid rgba(17, 26, 52, 0.1);
        border-radius: 20px;
        background: rgba(255, 255, 255, 0.8);
      }

      .job-career-score strong {
        display: block;
        margin-bottom: 13px;
        font-size: 2.3rem;
      }

      .job-career-score p {
        margin: 12px 0 0;
        color: #68758b;
      }

      .job-comparison-details {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 20px;
        margin-top: 28px;
      }

      .job-document-card,
      .job-description-card {
        padding: 24px;
      }

      .job-description-card h2 {
        margin: 0 0 12px;
        font-size: 1.2rem;
      }

      .job-description-card p {
        white-space: pre-wrap;
      }

      .job-document-value {
        overflow-wrap: anywhere;
      }

      .job-comparison-actions {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
        margin-top: 30px;
      }

      .job-primary-button,
      .job-secondary-button,
      .job-danger-button {
        display: inline-flex;
        min-height: 54px;
        justify-content: center;
        align-items: center;
        padding: 13px 18px;
        border: 1px solid rgba(17, 26, 52, 0.13);
        border-radius: 15px;
        font: inherit;
        font-weight: 800;
        text-align: center;
        text-decoration: none;
        cursor: pointer;
      }

      .job-primary-button {
        border-color: #2d6de9;
        background: #2d6de9;
        color: #ffffff;
        box-shadow: 0 12px 26px rgba(45, 109, 233, 0.22);
      }

      .job-secondary-button {
        background: #ffffff;
        color: #17233c;
      }

      .job-danger-button {
        grid-column: 1 / -1;
        background: #fff6f6;
        color: #a32929;
      }

      .job-comparison-empty {
        width: min(720px, calc(100% - 32px));
        margin: 80px auto;
        padding: clamp(32px, 7vw, 70px);
        text-align: center;
      }

      .job-comparison-empty-icon {
        display: grid;
        width: 58px;
        height: 58px;
        margin: 0 auto 26px;
        place-items: center;
        border-radius: 50%;
        background: #edf4ff;
        color: #266ce8;
        font-size: 1.7rem;
        font-weight: 900;
      }

      .job-comparison-empty h1 {
        font-size: clamp(2.2rem, 5vw, 4rem);
      }

      .job-comparison-empty > p:not(.job-comparison-eyebrow) {
        max-width: 580px;
        margin: 24px auto 0;
        color: #68758b;
        line-height: 1.7;
      }

      .job-comparison-empty-actions {
        display: flex;
        justify-content: center;
        gap: 14px;
        margin-top: 34px;
      }

      @media (max-width: 1050px) {
        .job-comparison-summary {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .job-comparison-actions {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 760px) {
        .job-comparison-page {
          padding: 22px 16px 44px;
        }

        .job-comparison-topbar,
        .job-comparison-header {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .job-comparison-header {
          gap: 24px;
        }

        .job-comparison-summary,
        .job-skill-grid,
        .job-career-card,
        .job-comparison-details,
        .job-comparison-actions {
          grid-template-columns: 1fr;
        }

        .job-comparison-card {
          border-radius: 22px;
        }

        .job-comparison-empty-actions {
          flex-direction: column;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .job-comparison-page *,
        .job-comparison-page *::before,
        .job-comparison-page *::after {
          scroll-behavior: auto !important;
          transition-duration: 0.01ms !important;
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
        }
      }
    `}</style>
  );
}

function JobComparison() {
  const [storedResult, setStoredResult] = useState(() => readStoredAnalysis());

  const comparison = useMemo(
    () => normaliseAnalysis(storedResult.data),
    [storedResult.data],
  );

  // Remove all possible stored keys
  function clearSavedComparison() {
    STORAGE_KEYS.forEach((key) => {
      window.localStorage.removeItem(key);
    });

    setStoredResult({
      storageKey: null,
      data: null,
    });
  }

  if (!comparison) {
    return <EmptyComparison />;
  }

  const matchVariant = getMatchVariant(comparison.matchScore);
  const careerVariant = getMatchVariant(comparison.careerScore);

  return (
    <main className="job-comparison-page">
      <div className="job-comparison-shell">
        <nav
          className="job-comparison-topbar"
          aria-label="Job comparison navigation"
        >
          <Link className="job-comparison-back" to="/dashboard">
            <span aria-hidden="true">←</span>
            Back to dashboard
          </Link>

          <span className="job-comparison-brand">
            CareerPilot AI · Job intelligence
          </span>
        </nav>

        <header className="job-comparison-header">
          <div>
            <p className="job-comparison-eyebrow">Latest comparison</p>
            <h1>
              Understand your
              <br />
              job compatibility.
            </h1>
          </div>

          <p className="job-comparison-introduction">
            Review how the skills detected in your CV compare with the
            requirements identified in the supplied job description.
          </p>
        </header>

        <section
          className="job-comparison-card"
          aria-labelledby="comparison-results-title"
        >
          <div className="job-comparison-section-heading">
            <p className="job-comparison-eyebrow">Comparison overview</p>
            <h2 id="comparison-results-title">Your latest result</h2>
            <p>
              The figures below come from the most recently saved CV analysis.
            </p>
          </div>

          <div className="job-comparison-summary">
            <article className="job-match-card">
              <p className="job-match-label">Overall match score</p>

              <strong className="job-match-number">
                {formatPercentage(comparison.matchScore)}
              </strong>

              <div
                className="job-match-track"
                role="progressbar"
                aria-label="Overall job match score"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={comparison.matchScore}
              >
                <span
                  className="job-match-fill"
                  style={{ width: `${comparison.matchScore}%` }}
                />
              </div>

              <p
                className={`job-match-level job-match-level--${matchVariant}`}
              >
                {comparison.matchLevel}
              </p>
            </article>

            <ComparisonStat
              label="Matched skills"
              value={comparison.matchedSkills.length}
              description="Skills found in both your CV and the job requirements."
            />

            <ComparisonStat
              label="Missing skills"
              value={comparison.missingSkills.length}
              description="Requirements that were not clearly detected in your CV."
            />

            <ComparisonStat
              label="Detected CV skills"
              value={comparison.detectedSkills.length}
              description="Skills extracted from the uploaded document."
            />
          </div>

          <div className="job-comparison-separator" />

          <div className="job-comparison-section-heading">
            <h2>Skills comparison</h2>
            <p>
              Compare your current strengths with the areas that may require
              further development.
            </p>
          </div>

          <div className="job-skill-grid">
            <SkillPanel
              title="Matched skills"
              description="Strengths identified in both sources."
              skills={comparison.matchedSkills}
              emptyMessage="No matched skills were returned for this analysis."
              variant="matched"
            />

            <SkillPanel
              title="Missing skills"
              description="Potential areas for learning and development."
              skills={comparison.missingSkills}
              emptyMessage="No missing skills were identified."
              variant="missing"
            />

            <SkillPanel
              title="Detected CV skills"
              description="Skills extracted from your uploaded CV."
              skills={comparison.detectedSkills}
              emptyMessage="No CV skills were detected."
            />

            <SkillPanel
              title="Required job skills"
              description="Requirements detected in the job description."
              skills={comparison.requiredSkills}
              emptyMessage="No required skills were detected from the supplied description."
            />
          </div>

          <article className="job-career-card">
            <div className="job-career-copy">
              <p className="job-comparison-eyebrow">
                Career recommendation
              </p>

              <h2>{comparison.recommendedCareer}</h2>

              <p>
                This recommendation is based on the skills and career
                information returned by your latest CV analysis.
              </p>
            </div>

            <div className="job-career-score">
              <p className="job-match-label">Career compatibility</p>

              <strong>{formatPercentage(comparison.careerScore)}</strong>

              <div
                className="job-career-track"
                role="progressbar"
                aria-label="Career compatibility score"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow={comparison.careerScore}
              >
                <span
                  className="job-career-fill"
                  style={{ width: `${comparison.careerScore}%` }}
                />
              </div>

              <p
                className={`job-match-level job-match-level--${careerVariant}`}
              >
                {comparison.careerMatchLevel}
              </p>
            </div>
          </article>

          <div className="job-comparison-details">
            <article className="job-document-card">
              <p className="job-document-label">Uploaded document</p>
              <p className="job-document-value">
                <strong>{comparison.filename}</strong>
              </p>

              {comparison.extractedCharacters !== null && (
                <>
                  <p
                    className="job-document-label"
                    style={{ marginTop: "22px" }}
                  >
                    Extracted characters
                  </p>

                  <p className="job-document-value">
                    {Number(comparison.extractedCharacters).toLocaleString()}
                  </p>
                </>
              )}
            </article>

            <article className="job-description-card">
              <h2>Submitted job description</h2>

              <p>
                {comparison.jobDescription ||
                  "The saved backend response did not contain the original job-description text."}
              </p>
            </article>
          </div>

          <div className="job-comparison-actions">
            <Link className="job-secondary-button" to="/upload-cv">
              Analyse another CV
            </Link>

            <Link
              className="job-secondary-button"
              to="/career-recommendations"
            >
              Career recommendations
            </Link>

            <Link className="job-secondary-button" to="/learning-roadmap">
              Learning roadmap
            </Link>

            <Link className="job-primary-button" to="/dashboard">
              Return to dashboard
            </Link>

            <button
              className="job-danger-button"
              type="button"
              onClick={clearSavedComparison}
            >
              Clear saved result
            </button>
          </div>
        </section>
      </div>

      <JobComparisonStyles />
    </main>
  );
}

export default JobComparison;