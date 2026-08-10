import { useMemo, useState } from "react";
import { Link } from "react-router-dom";


// localStorage keys 
const STORAGE_KEYS = [
  "careerPilotLatestAnalysis",
  "careerpilot_latest_analysis",
  "latestCvAnalysis",
  "latestAnalysis",
  "cvAnalysis",
];

// Inject CSS to the page
const PAGE_STYLES = `
  .career-recommendation-page {
    min-height: 100vh;
    padding: 42px 24px 64px;
    color: #172033;
    background:
      radial-gradient(circle at 50% 0%, rgba(95, 148, 255, 0.15), transparent 34rem),
      linear-gradient(135deg, #f9fbff 0%, #f7f5ff 50%, #f4fbff 100%);
  }

  .career-recommendation-container {
    width: min(1180px, 100%);
    margin: 0 auto;
  }

  .career-recommendation-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 38px;
  }

  .career-back-link,
  .career-text-link {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    color: #172033;
    font-weight: 700;
    text-decoration: none;
    transition:
      color 160ms ease,
      transform 160ms ease;
  }

  .career-back-link:hover,
  .career-text-link:hover {
    color: #2868e8;
    transform: translateX(-2px);
  }

  .career-page-label {
    color: #4f8df4;
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  .career-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(280px, 0.8fr);
    align-items: end;
    gap: 40px;
    margin-bottom: 34px;
  }

  .career-hero h1 {
    max-width: 720px;
    margin: 10px 0 0;
    color: #10182d;
    font-size: clamp(2.6rem, 6vw, 5.2rem);
    font-weight: 750;
    letter-spacing: -0.065em;
    line-height: 0.98;
  }

  .career-hero p {
    margin: 0 0 8px;
    color: #657087;
    font-size: 1.08rem;
    line-height: 1.75;
  }

  .career-panel,
  .career-empty-card,
  .career-error-card {
    border: 1px solid rgba(21, 36, 67, 0.11);
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 24px 70px rgba(59, 86, 139, 0.12);
    backdrop-filter: blur(12px);
  }

  .career-panel {
    overflow: hidden;
  }

  .career-main-result {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 230px;
    gap: 30px;
    padding: 38px;
    background:
      linear-gradient(120deg, rgba(249, 247, 255, 0.97), rgba(236, 246, 255, 0.96));
  }

  .career-section-eyebrow {
    margin: 0 0 12px;
    color: #4f8df4;
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .career-main-result h2 {
    margin: 0 0 14px;
    color: #10182d;
    font-size: clamp(2rem, 4vw, 3.4rem);
    letter-spacing: -0.045em;
    line-height: 1.05;
  }

  .career-main-copy {
    max-width: 720px;
    margin: 0;
    color: #647086;
    font-size: 1rem;
    line-height: 1.7;
  }

  .career-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 24px;
  }

  .career-badge {
    display: inline-flex;
    align-items: center;
    min-height: 34px;
    padding: 6px 13px;
    border: 1px solid rgba(41, 104, 232, 0.16);
    border-radius: 999px;
    color: #2757ad;
    background: rgba(255, 255, 255, 0.8);
    font-size: 0.86rem;
    font-weight: 750;
  }

  .career-score-card {
    display: grid;
    place-items: center;
    align-content: center;
    min-height: 215px;
    padding: 22px;
    border: 1px solid rgba(41, 104, 232, 0.16);
    border-radius: 24px;
    text-align: center;
    background: rgba(255, 255, 255, 0.78);
  }

  .career-score-ring {
    --score-angle: 0deg;

    position: relative;
    display: grid;
    width: 138px;
    height: 138px;
    place-items: center;
    border-radius: 50%;
    background:
      radial-gradient(circle closest-side, #ffffff 74%, transparent 76% 100%),
      conic-gradient(#2d6be9 var(--score-angle), #dce8fa 0);
  }

  .career-score-ring strong {
    color: #172033;
    font-size: 1.75rem;
  }

  .career-score-label {
    margin-top: 14px;
    color: #657087;
    font-size: 0.88rem;
    font-weight: 700;
  }

  .career-content {
    padding: 38px;
  }

  .career-section-header {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 20px;
    margin-bottom: 20px;
  }

  .career-section-header h2,
  .career-section-header h3 {
    margin: 0;
    color: #151e32;
    font-size: clamp(1.45rem, 3vw, 2rem);
    letter-spacing: -0.025em;
  }

  .career-section-header p {
    max-width: 610px;
    margin: 7px 0 0;
    color: #6a7488;
    line-height: 1.6;
  }

  .career-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
  }

  .career-option-card {
    position: relative;
    min-width: 0;
    padding: 22px;
    border: 1px solid rgba(30, 49, 83, 0.11);
    border-radius: 20px;
    background: #ffffff;
    transition:
      border-color 180ms ease,
      box-shadow 180ms ease,
      transform 180ms ease;
  }

  .career-option-card:hover {
    border-color: rgba(45, 107, 233, 0.3);
    box-shadow: 0 18px 38px rgba(50, 83, 145, 0.11);
    transform: translateY(-3px);
  }

  .career-option-rank {
    display: grid;
    width: 34px;
    height: 34px;
    margin-bottom: 18px;
    place-items: center;
    border-radius: 11px;
    color: #ffffff;
    background: #2d6be9;
    font-size: 0.85rem;
    font-weight: 800;
  }

  .career-option-card h3 {
    margin: 0;
    overflow-wrap: anywhere;
    color: #172033;
    font-size: 1.08rem;
  }

  .career-option-score-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 18px;
    color: #687389;
    font-size: 0.88rem;
  }

  .career-option-score-row strong {
    color: #172033;
  }

  .career-progress {
    width: 100%;
    height: 9px;
    margin-top: 10px;
    overflow: hidden;
    border-radius: 999px;
    background: #e7eef9;
  }

  .career-progress > span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, #2d6be9, #6da6ff);
  }

  .career-divider {
    height: 1px;
    margin: 36px 0;
    background: rgba(23, 32, 51, 0.1);
  }

  .career-skill-columns {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
  }

  .career-skill-card {
    min-width: 0;
    padding: 23px;
    border: 1px solid rgba(30, 49, 83, 0.11);
    border-radius: 20px;
    background: #ffffff;
  }

  .career-skill-card h3 {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin: 0 0 16px;
    color: #172033;
    font-size: 1.05rem;
  }

  .career-count {
    display: grid;
    min-width: 30px;
    height: 30px;
    padding: 0 8px;
    place-items: center;
    border-radius: 999px;
    color: #285fbf;
    background: #eaf2ff;
    font-size: 0.8rem;
    font-weight: 800;
  }

  .career-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 9px;
  }

  .career-tag {
    display: inline-flex;
    max-width: 100%;
    align-items: center;
    padding: 8px 11px;
    border-radius: 10px;
    overflow-wrap: anywhere;
    color: #33415d;
    background: #f2f6fc;
    font-size: 0.85rem;
    font-weight: 650;
  }

  .career-tag-success {
    color: #176144;
    background: #e8f8f0;
  }

  .career-tag-warning {
    color: #8b4e19;
    background: #fff3e3;
  }

  .career-empty-message {
    margin: 0;
    color: #758095;
    font-size: 0.93rem;
    line-height: 1.6;
  }

  .career-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    margin-top: 32px;
  }

  .career-primary-button,
  .career-secondary-button {
    display: inline-flex;
    min-height: 50px;
    align-items: center;
    justify-content: center;
    gap: 9px;
    padding: 12px 20px;
    border: 1px solid transparent;
    border-radius: 14px;
    font-weight: 800;
    text-decoration: none;
    transition:
      box-shadow 170ms ease,
      transform 170ms ease,
      background 170ms ease;
  }

  .career-primary-button {
    color: #ffffff;
    background: #2d6be9;
    box-shadow: 0 13px 25px rgba(45, 107, 233, 0.22);
  }

  .career-primary-button:hover {
    background: #215dd7;
    box-shadow: 0 16px 30px rgba(45, 107, 233, 0.28);
    transform: translateY(-2px);
  }

  .career-secondary-button {
    border-color: rgba(23, 32, 51, 0.14);
    color: #172033;
    background: #ffffff;
  }

  .career-secondary-button:hover {
    border-color: rgba(45, 107, 233, 0.28);
    color: #245ec8;
    transform: translateY(-2px);
  }

  .career-empty-card,
  .career-error-card {
    padding: 64px 30px;
    text-align: center;
  }

  .career-empty-icon,
  .career-error-icon {
    display: grid;
    width: 70px;
    height: 70px;
    margin: 0 auto 22px;
    place-items: center;
    border-radius: 22px;
    color: #2d6be9;
    background: #eaf2ff;
  }

  .career-error-icon {
    color: #a33c3c;
    background: #ffeded;
  }

  .career-empty-card h2,
  .career-error-card h2 {
    margin: 0 0 12px;
    color: #172033;
    font-size: clamp(1.8rem, 4vw, 2.6rem);
  }

  .career-empty-card p,
  .career-error-card p {
    max-width: 610px;
    margin: 0 auto 26px;
    color: #6b7589;
    line-height: 1.7;
  }

  @media (max-width: 900px) {
    .career-hero,
    .career-main-result {
      grid-template-columns: 1fr;
    }

    .career-score-card {
      min-height: auto;
    }

    .career-grid,
    .career-skill-columns {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .career-recommendation-page {
      padding: 24px 14px 42px;
    }

    .career-recommendation-topbar,
    .career-section-header,
    .career-actions {
      align-items: flex-start;
      flex-direction: column;
    }

    .career-hero {
      gap: 22px;
      margin-bottom: 24px;
    }

    .career-main-result,
    .career-content {
      padding: 24px 18px;
    }

    .career-grid,
    .career-skill-columns {
      grid-template-columns: 1fr;
    }

    .career-primary-button,
    .career-secondary-button {
      width: 100%;
    }
  }
`;

// Read stored analysis from localStorage using keys
function readStoredAnalysis() {
  for (const storageKey of STORAGE_KEYS) {
    const storedValue = window.localStorage.getItem(storageKey);

    if (!storedValue) {
      continue;
    }

    try {
      return JSON.parse(storedValue);
    } catch {
      
    }
  }

  return null;
}

// load function that returns analysis or an error 
function loadInitialAnalysis() {
  try {
    return {
      analysis: readStoredAnalysis(),
      error: "",
    };
  } catch {
    return {
      analysis: null,
      error:
        "The saved CV analysis could not be read. Please analyse your CV again.",
    };
  }
}

function getAnalysisObject(storedData) {
  if (!storedData || typeof storedData !== "object") {
    return null;
  }

  if (storedData.analysis && typeof storedData.analysis === "object") {
    return storedData.analysis;
  }

  if (
    storedData.data?.analysis &&
    typeof storedData.data.analysis === "object"
  ) {
    return storedData.data.analysis;
  }

  if (storedData.result && typeof storedData.result === "object") {
    return storedData.result;
  }

  return storedData;
}

// Ensure the input is an array
function ensureArray(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  return [];
}

// Normalise a skill name
function normaliseSkillName(skill) {
  if (typeof skill === "string") {
    return skill.replaceAll("_", " ").trim();
  }

  if (skill && typeof skill === "object") {
    const possibleName =
      skill.name ||
      skill.title ||
      skill.skill ||
      skill.label ||
      skill.preferred_label;

    if (typeof possibleName === "string") {
      return possibleName.replaceAll("_", " ").trim();
    }
  }

  return "";
}

function normaliseSkillList(value) {
  return ensureArray(value)
    .map(normaliseSkillName)
    .filter(Boolean)
    .filter((skill, index, allSkills) => allSkills.indexOf(skill) === index);
}

// Convert score to a percentage value
function normaliseScore(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  if (numericValue > 0 && numericValue <= 1) {
    return Math.min(100, numericValue * 100);
  }

  return Math.min(100, Math.max(0, numericValue));
}


function formatPercentage(value) {
  const score = normaliseScore(value);

  return Number.isInteger(score) ? `${score}%` : `${score.toFixed(2)}%`;
}

function formatCareerName(value) {
  if (typeof value !== "string" || value.trim() === "") {
    return "Career pathway unavailable";
  }

  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .trim();
}

// grades match level
function getMatchLevel(score, suppliedLevel) {
  if (typeof suppliedLevel === "string" && suppliedLevel.trim()) {
    return suppliedLevel
      .replaceAll("_", " ")
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  const numericScore = normaliseScore(score);

  if (numericScore >= 75) {
    return "Strong match";
  }

  if (numericScore >= 50) {
    return "Good match";
  }

  if (numericScore >= 25) {
    return "Developing match";
  }

  return "Low match";
}

function createCareerOptions(careerRecommendation, analysis) {
  const possibleScores =
    careerRecommendation?.all_career_scores ||
    careerRecommendation?.career_scores ||
    analysis?.all_career_scores ||
    analysis?.career_scores ||
    {};

  let careerEntries = [];

  if (Array.isArray(possibleScores)) {
    careerEntries = possibleScores.map((career) => {
      if (typeof career === "string") {
        return {
          name: career,
          score: 0,
        };
      }

      return {
        name:
          career?.career ||
          career?.occupation ||
          career?.title ||
          career?.name ||
          "Career option",
        score:
          career?.score ??
          career?.match_score ??
          career?.career_match_score ??
          0,
      };
    });
  } else if (possibleScores && typeof possibleScores === "object") {
    careerEntries = Object.entries(possibleScores).map(([name, score]) => ({
      name,
      score:
        typeof score === "object"
          ? score?.score ?? score?.match_score ?? 0
          : score,
    }));
  }

  return careerEntries
    .map((career) => ({
      name: formatCareerName(career.name),
      score: normaliseScore(career.score),
    }))
    .filter((career) => career.name !== "Career Pathway Unavailable")
    .sort((firstCareer, secondCareer) => secondCareer.score - firstCareer.score)
    .slice(0, 6);
}

// SVG icon wrapper component
function Icon({ children, size = 22 }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      {children}
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <Icon size={27}>
      <path
        d="M9 7V5.8C9 4.8 9.8 4 10.8 4h2.4C14.2 4 15 4.8 15 5.8V7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <rect
        height="12"
        rx="2.2"
        stroke="currentColor"
        strokeWidth="1.8"
        width="18"
        x="3"
        y="7"
      />
      <path
        d="M3.5 11.5c4.4 2.1 12.6 2.1 17 0M10 13.5h4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </Icon>
  );
}

function ArrowLeftIcon() {
  return (
    <Icon size={19}>
      <path
        d="m15 18-6-6 6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </Icon>
  );
}

function ArrowRightIcon() {
  return (
    <Icon size={19}>
      <path
        d="m9 18 6-6-6-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </Icon>
  );
}

function RefreshIcon() {
  return (
    <Icon size={19}>
      <path
        d="M20 7v5h-5M4 17v-5h5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
      <path
        d="M18.5 9A7 7 0 0 0 6.3 6.4L4 9m16 6-2.3 2.6A7 7 0 0 1 5.5 15"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.9"
      />
    </Icon>
  );
}

// Main component
function CareerRecommendation() {
  const [initialState] = useState(loadInitialAnalysis);

  const storedAnalysis = initialState.analysis;
  const storageError = initialState.error;

  const viewModel = useMemo(() => {
    const analysis = getAnalysisObject(storedAnalysis);

    if (!analysis) {
      return null;
    }

    // Extract career recommendation
    const careerRecommendation =
      analysis.career_recommendation ||
      analysis.careerRecommendation ||
      storedAnalysis?.career_recommendation ||
      {};

    const recommendedCareer =
      careerRecommendation.recommended_career ||
      careerRecommendation.career ||
      careerRecommendation.occupation ||
      careerRecommendation.title ||
      analysis.recommended_career ||
      analysis.recommendedCareer ||
      "Career pathway unavailable";

    const careerScore =
      careerRecommendation.career_match_score ??
      careerRecommendation.match_score ??
      careerRecommendation.score ??
      analysis.career_match_score ??
      analysis.match_score ??
      0;

    const matchLevel =
      careerRecommendation.career_match_level ||
      careerRecommendation.match_level ||
      analysis.career_match_level ||
      analysis.match_level;

    // Normalise skill lists from different property names
    const cvSkills = normaliseSkillList(
      analysis.cv_skills ||
        analysis.detected_skills ||
        analysis.skills ||
        storedAnalysis?.cv_skills,
    );

    const matchedSkills = normaliseSkillList(
      analysis.matched_skills ||
        analysis.matching_skills ||
        storedAnalysis?.matched_skills,
    );

    const missingSkills = normaliseSkillList(
      analysis.missing_skills ||
        analysis.missing_skill_priority ||
        storedAnalysis?.missing_skills,
    );

    return {
      recommendedCareer: formatCareerName(recommendedCareer),
      careerScore: normaliseScore(careerScore),
      matchLevel: getMatchLevel(careerScore, matchLevel),
      careerOptions: createCareerOptions(careerRecommendation, analysis),
      cvSkills,
      matchedSkills,
      missingSkills,
    };
  }, [storedAnalysis]);

  return (
    <>
     {/* Page-specific styles */}
      <style>{PAGE_STYLES}</style>

      <main className="career-recommendation-page">
        <div className="career-recommendation-container">
          <div className="career-recommendation-topbar">
            <Link className="career-back-link" to="/dashboard">
              <ArrowLeftIcon />
              Back to dashboard
            </Link>

            <span className="career-page-label">Career intelligence</span>
          </div>

          <header className="career-hero">
            <div>
              <span className="career-page-label">Career recommendation</span>
              <h1>Find your best job options.</h1>
            </div>

            <p>
              CareerPilot AI uses the skills detected in your CV and your latest
              job comparison to highlight career options that are the best for your
              current profile.
            </p>
          </header>

          {storageError ? (
            <section className="career-error-card" role="alert">
              <div className="career-error-icon">
                <BriefcaseIcon />
              </div>

              <h2>We could not load your analysis</h2>
              <p>{storageError}</p>

              <Link className="career-primary-button" to="/upload-cv">
                Analyse your CV again
                <ArrowRightIcon />
              </Link>
            </section>
          ) : !viewModel ? (
            <section className="career-empty-card">
              <div className="career-empty-icon">
                <BriefcaseIcon />
              </div>

              <span className="career-page-label">No analysis found</span>
              <h2>Analyse a CV to receive career recommendations</h2>

              <p>
                Upload your PDF CV and compare it with a detailed job
                description. Your latest recommendation will then appear on
                this page.
              </p>

              <Link className="career-primary-button" to="/upload-cv">
                Analyse a CV
                <ArrowRightIcon />
              </Link>
            </section>
          ) : (
            <section className="career-panel">
              <div className="career-main-result">
                <div>
                  <p className="career-section-eyebrow">
                    Recommended pathway
                  </p>

                  <h2>{viewModel.recommendedCareer}</h2>

                  <p className="career-main-copy">
                    This recommendation is based on the skills found in your latest CV analysis.
                    Use it as a guide alongside your experience, interests, qualifications, and career goals.

                  </p>

                  <div className="career-badges">
                    <span className="career-badge">
                      {viewModel.matchLevel}
                    </span>

                    <span className="career-badge">
                      {viewModel.cvSkills.length} detected CV skills
                    </span>

                    <span className="career-badge">
                      {viewModel.matchedSkills.length} matched skills
                    </span>
                  </div>
                </div>

                 {/* score display */}
                <div className="career-score-card">
                  <div
                    aria-label={`Career match score ${formatPercentage(
                      viewModel.careerScore,
                    )}`}
                    className="career-score-ring"
                    role="img"
                    style={{
                      "--score-angle": `${viewModel.careerScore * 3.6}deg`,
                    }}
                  >
                    <strong>{formatPercentage(viewModel.careerScore)}</strong>
                  </div>

                  <span className="career-score-label">
                    Career compatibility score
                  </span>
                </div>
              </div>

              <div className="career-content">
                <section aria-labelledby="career-options-heading">
                  <div className="career-section-header">
                    <div>
                      <h2 id="career-options-heading">
                        Alternative career options
                      </h2>

                      <p>
                        See other job options based on your latest CV results.
                      </p>
                    </div>
                  </div>

                  {viewModel.careerOptions.length > 0 ? (
                    <div className="career-grid">
                      {viewModel.careerOptions.map((career, index) => (
                        <article
                          className="career-option-card"
                          key={`${career.name}-${index}`}
                        >
                          <span className="career-option-rank">
                            {index + 1}
                          </span>

                          <h3>{career.name}</h3>

                          <div className="career-option-score-row">
                            <span>Compatibility</span>
                            <strong>{formatPercentage(career.score)}</strong>
                          </div>

                          {/* Progress bar */}
                          <div
                            aria-label={`${career.name} compatibility ${formatPercentage(
                              career.score,
                            )}`}
                            className="career-progress"
                            role="progressbar"
                            aria-valuemax="100"
                            aria-valuemin="0"
                            aria-valuenow={career.score}
                          >
                            <span
                              style={{
                                width: `${career.score}%`,
                              }}
                            />
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="career-empty-message">
                      one career recommendation was found for your profile right now.
                    </p>
                  )}
                </section>

                <div className="career-divider" />

                <section aria-labelledby="career-skills-heading">
                  <div className="career-section-header">
                    <div>
                      <h2 id="career-skills-heading">Skills behind the result</h2>

                      <p>
                       These skills were used to create your career analysis.
                      </p>
                    </div>
                  </div>

                  <div className="career-skill-columns">
                    <SkillCard
                      emptyMessage="No CV skills were returned."
                      skills={viewModel.cvSkills}
                      title="Detected CV skills"
                      variant="default"
                    />

                    <SkillCard
                      emptyMessage="No matched skills were returned."
                      skills={viewModel.matchedSkills}
                      title="Matched skills"
                      variant="success"
                    />

                    <SkillCard
                      emptyMessage="No missing skills were identified."
                      skills={viewModel.missingSkills}
                      title="Development areas"
                      variant="warning"
                    />
                  </div>
                </section>

                <div className="career-actions">
                  <Link className="career-secondary-button" to="/upload-cv">
                    <RefreshIcon />
                    Run another analysis
                  </Link>

                  <Link className="career-primary-button" to="/dashboard">
                    Return to dashboard
                    <ArrowRightIcon />
                  </Link>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}

// Reusable skill card component
function SkillCard({ title, skills, emptyMessage, variant }) {
  const variantClass =
    variant === "success"
      ? "career-tag-success"
      : variant === "warning"
        ? "career-tag-warning"
        : "";

  return (
    <article className="career-skill-card">
      <h3>
        {title}
        <span className="career-count">{skills.length}</span>
      </h3>

      {skills.length > 0 ? (
        <div className="career-tags">
          {skills.map((skill) => (
            <span
              className={`career-tag ${variantClass}`.trim()}
              key={skill}
            >
              {skill}
            </span>
          ))}
        </div>
      ) : (
        <p className="career-empty-message">{emptyMessage}</p>
      )}
    </article>
  );
}

export default CareerRecommendation;