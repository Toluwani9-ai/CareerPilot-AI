import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const ANALYSIS_STORAGE_KEYS = [
  "careerPilotLatestAnalysis",
  "careerPilotAnalysis",
  "latestCVAnalysis",
];

const ROADMAP_PROGRESS_KEY = "careerPilotRoadmapProgress";

// Utility functions
function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function readLatestAnalysis() {
  for (const key of ANALYSIS_STORAGE_KEYS) {
    try {
      const storedValue = localStorage.getItem(key);

      if (!storedValue) {
        continue;
      }

      const parsedValue = JSON.parse(storedValue);

      if (isObject(parsedValue)) {
        return parsedValue;
      }
    } catch {
    }
  }

  return null;
}

function readSavedProgress() {
  try {
    const storedValue = localStorage.getItem(ROADMAP_PROGRESS_KEY);

    if (!storedValue) {
      return {};
    }

    const parsedValue = JSON.parse(storedValue);

    return isObject(parsedValue) ? parsedValue : {};
  } catch {
    return {};
  }
}

function normaliseSkillName(skill) {
  if (typeof skill === "string") {
    return skill.trim().toLowerCase();
  }

  if (isObject(skill)) {
    const possibleName =
      skill.name ??
      skill.skill ??
      skill.title ??
      skill.label ??
      skill.preferred_label;

    return typeof possibleName === "string"
      ? possibleName.trim().toLowerCase()
      : "";
  }

  return "";
}

function uniqueSkills(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return [
    ...new Set(
      values.map(normaliseSkillName).filter((skillName) => skillName.length > 0),
    ),
  ];
}

function formatSkillName(skill) {
  if (!skill) {
    return "Professional development";
  }

  return skill
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function normaliseScore(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  const percentage = numericValue > 0 && numericValue <= 1
    ? numericValue * 100
    : numericValue;

  return Math.min(100, Math.max(0, Number(percentage.toFixed(2))));
}

function getAnalysisSection(savedAnalysis) {
  if (!isObject(savedAnalysis)) {
    return {};
  }

  return isObject(savedAnalysis.analysis)
    ? savedAnalysis.analysis
    : savedAnalysis;
}

function extractMissingSkills(savedAnalysis) {
  const analysis = getAnalysisSection(savedAnalysis);

  return uniqueSkills([
    ...(Array.isArray(analysis.missing_skill_priority)
      ? analysis.missing_skill_priority
      : []),
    ...(Array.isArray(analysis.missing_skills)
      ? analysis.missing_skills
      : []),
    ...(Array.isArray(savedAnalysis?.missing_skill_priority)
      ? savedAnalysis.missing_skill_priority
      : []),
    ...(Array.isArray(savedAnalysis?.missing_skills)
      ? savedAnalysis.missing_skills
      : []),
  ]);
}
// get skills that already match the job description required skills
function extractMatchedSkills(savedAnalysis) {
  const analysis = getAnalysisSection(savedAnalysis);

  return uniqueSkills([
    ...(Array.isArray(analysis.matched_skills)
      ? analysis.matched_skills
      : []),
    ...(Array.isArray(savedAnalysis?.matched_skills)
      ? savedAnalysis.matched_skills
      : []),
  ]);
}
// get skills detected the uploaded CV
function extractDetectedSkills(savedAnalysis) {
  const analysis = getAnalysisSection(savedAnalysis);

  return uniqueSkills([
    ...(Array.isArray(analysis.cv_skills) ? analysis.cv_skills : []),
    ...(Array.isArray(savedAnalysis?.cv_skills)
      ? savedAnalysis.cv_skills
      : []),
  ]);
}

function extractRecommendation(savedAnalysis) {
  const analysis = getAnalysisSection(savedAnalysis);

  const recommendation =
    analysis.career_recommendation ??
    savedAnalysis?.career_recommendation ??
    {};

  if (typeof recommendation === "string") {
    return {
      career: recommendation,
      score: 0,
      level: "",
    };
  }

  return {
    career:
      recommendation.recommended_career ??
      recommendation.career ??
      recommendation.title ??
      "Your target career",
    score: normaliseScore(
      recommendation.career_match_score ??
        recommendation.match_score ??
        analysis.career_match_score ??
        0,
    ),
    level:
      recommendation.career_match_level ??
      recommendation.match_level ??
      analysis.match_level ??
      "",
  };
}


// Roadmap content library
const SKILL_PLANS = {
  python: {
    description:
      "Build practical Python foundations for automation, analysis and backend development.",
    activities: [
      "Understand variables, data types and operators",
      "Practise conditions, loops and reusable functions",
      "Work with lists, dictionaries, sets and tuples",
      "Read and write CSV and JSON files",
      "Complete a small Python automation project",
    ],
    project:
      "Create a Python script that cleans a CSV dataset and produces a summary report.",
    resources: [
      "Python official tutorial",
      "Exercism Python track",
      "Kaggle Python course",
    ],
  },

  sql: {
    description:
      "Learn to retrieve, filter, combine and summarise data stored in relational databases.",
    activities: [
      "Learn SELECT, WHERE, ORDER BY and LIMIT",
      "Use aggregate functions and GROUP BY",
      "Practise INNER, LEFT and RIGHT JOIN operations",
      "Understand primary and foreign keys",
      "Solve realistic database query exercises",
    ],
    project:
      "Design a small careers database and write queries that produce useful reports.",
    resources: [
      "SQLBolt",
      "PostgreSQL documentation",
      "HackerRank SQL practice",
    ],
  },

  data_analysis: {
    description:
      "Develop a structured approach to cleaning, exploring and communicating information.",
    activities: [
      "Define measurable questions before analysing data",
      "Clean missing, duplicated and inconsistent values",
      "Calculate descriptive statistics",
      "Identify trends, outliers and relationships",
      "Present evidence-based conclusions",
    ],
    project:
      "Analyse a public dataset and produce a concise report with actionable findings.",
    resources: [
      "Kaggle data analysis courses",
      "Pandas documentation",
      "Microsoft Learn data modules",
    ],
  },

  data_visualisation: {
    description:
      "Communicate data clearly through charts, dashboards and visual storytelling.",
    activities: [
      "Choose suitable charts for different data types",
      "Apply clear labels, scales and visual hierarchy",
      "Create charts using a programming library",
      "Build an interactive dashboard",
      "Evaluate visualisations for accessibility",
    ],
    project:
      "Build a dashboard that communicates three important findings from a dataset.",
    resources: [
      "Microsoft Power BI learning paths",
      "Tableau Public training",
      "Matplotlib documentation",
    ],
  },

  microsoft_excel: {
    description:
      "Improve spreadsheet modelling, analysis and reporting capabilities.",
    activities: [
      "Practise formulas and structured references",
      "Use XLOOKUP or equivalent lookup functions",
      "Create pivot tables and pivot charts",
      "Apply data validation and conditional formatting",
      "Clean data with spreadsheet tools",
    ],
    project:
      "Create a reusable reporting workbook with calculations, charts and a summary dashboard.",
    resources: [
      "Microsoft Excel training",
      "Microsoft Learn",
      "Excel practice datasets",
    ],
  },

  communication: {
    description:
      "Strengthen the ability to explain ideas, evidence and recommendations clearly.",
    activities: [
      "Structure explanations around a clear objective",
      "Practise summarising technical work for non-technical readers",
      "Use evidence to support recommendations",
      "Request and apply feedback",
      "Deliver a short presentation",
    ],
    project:
      "Prepare and deliver a five-minute presentation explaining one completed project.",
    resources: [
      "Toastmasters learning materials",
      "University presentation-skills resources",
      "Technical-writing practice",
    ],
  },

  problem_solving: {
    description:
      "Apply repeatable techniques for understanding and solving unfamiliar problems.",
    activities: [
      "Break large problems into smaller tasks",
      "Write assumptions and constraints before implementation",
      "Compare multiple possible solutions",
      "Test edge cases and failure conditions",
      "Reflect on completed solutions",
    ],
    project:
      "Document how you investigated and solved a realistic technical problem.",
    resources: [
      "Codewars exercises",
      "HackerRank problem-solving track",
      "Algorithm visualisation tools",
    ],
  },

  security: {
    description:
      "Learn essential principles for protecting applications, information and users.",
    activities: [
      "Understand authentication and authorisation",
      "Validate and sanitise application input",
      "Protect credentials and environment variables",
      "Study common web application vulnerabilities",
      "Apply secure error handling",
    ],
    project:
      "Review one of your applications and create a documented security-improvement checklist.",
    resources: [
      "OWASP Top 10",
      "PortSwigger Web Security Academy",
      "MDN web-security guidance",
    ],
  },

  react: {
    description:
      "Build maintainable user interfaces using modern React patterns.",
    activities: [
      "Review components, props and state",
      "Practise controlled forms and validation",
      "Use effects only for external synchronisation",
      "Implement accessible loading and error states",
      "Build reusable interface components",
    ],
    project:
      "Create a responsive React feature with validation, persistence and accessible feedback.",
    resources: [
      "React documentation",
      "MDN accessibility guidance",
      "React Router documentation",
    ],
  },

  git: {
    description:
      "Use version control confidently when developing and documenting software.",
    activities: [
      "Create focused commits with meaningful messages",
      "Use branches for separate features",
      "Resolve a merge conflict",
      "Review differences before committing",
      "Document project setup in a README",
    ],
    project:
      "Manage a complete feature through a branch, commits, review and merge.",
    resources: [
      "Git documentation",
      "GitHub Skills",
      "Atlassian Git tutorials",
    ],
  },
};

function createGenericPlan(skill) {
  const displayName = formatSkillName(skill);

  return {
    description: `Develop practical knowledge of ${displayName} and demonstrate it through a focused portfolio activity.`,
    activities: [
      `Understand the main concepts and terminology used in ${displayName}`,
      `Complete an introductory ${displayName} learning module`,
      `Practise ${displayName} with guided exercises`,
      `Apply ${displayName} to a realistic task`,
      `Document what you learned and identify your next improvement`,
    ],
    project: `Create a small portfolio project demonstrating practical use of ${displayName}.`,
    resources: [
      `Official ${displayName} documentation`,
      `${displayName} introductory course`,
      `${displayName} practical exercises`,
    ],
  };
}

function buildRoadmap(missingSkills) {
  return missingSkills.map((skill, index) => {
    const normalisedKey = skill.replace(/[\s-]+/g, "_");
    const plan = SKILL_PLANS[normalisedKey] ?? createGenericPlan(skill);

    return {
      id: `${normalisedKey}-${index}`,
      skill,
      title: formatSkillName(skill),
      week: index + 1,
      ...plan,
    };
  });
}


//reusable label used to display skills across the page
function SkillTag({ children, variant = "default" }) {
  return (
    <span className={`roadmap-skill-tag roadmap-skill-tag--${variant}`}>
      {children}
    </span>
  );
}

function ProgressRing({ percentage }) {
  const safePercentage = Math.min(100, Math.max(0, percentage));
  const circumference = 2 * Math.PI * 48;
  const offset = circumference - (safePercentage / 100) * circumference;

  return (
    <div
      className="roadmap-progress-ring"
      aria-label={`${safePercentage}% of roadmap activities completed`}
    >
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle
          className="roadmap-progress-ring__track"
          cx="60"
          cy="60"
          r="48"
        />
        <circle
          className="roadmap-progress-ring__value"
          cx="60"
          cy="60"
          r="48"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>

      <strong>{safePercentage}%</strong>
    </div>
  );
}

function RoadmapStage({
  stage,
  progress,
  onToggleActivity,
  defaultExpanded,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const completedCount = stage.activities.filter(
    (_, activityIndex) => progress[`${stage.id}-${activityIndex}`],
  ).length;

  const stagePercentage = Math.round(
    (completedCount / stage.activities.length) * 100,
  );

  return (
    <article className="roadmap-stage">
      <button
        type="button"
        className="roadmap-stage__header"
        onClick={() => setExpanded((currentValue) => !currentValue)}
        aria-expanded={expanded}
      >
        <span className="roadmap-stage__number">{stage.week}</span>

        <span className="roadmap-stage__heading">
          <span className="roadmap-stage__eyebrow">
            Development stage {stage.week}
          </span>

          <strong>{stage.title}</strong>

          <span>{stage.description}</span>
        </span>

        <span className="roadmap-stage__summary">
          <span>{stagePercentage}% complete</span>
          <span aria-hidden="true">{expanded ? "−" : "+"}</span>
        </span>
      </button>

      {expanded && (
        <div className="roadmap-stage__content">
          <section className="roadmap-stage__activities">
            <h3>Learning activities</h3>

            <div className="roadmap-checklist">
              {stage.activities.map((activity, activityIndex) => {
                const progressKey = `${stage.id}-${activityIndex}`;
                const isCompleted = Boolean(progress[progressKey]);

                return (
                  <label
                    className={`roadmap-checklist__item ${
                      isCompleted ? "is-complete" : ""
                    }`}
                    key={progressKey}
                  >
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => onToggleActivity(progressKey)}
                    />

                    <span className="roadmap-checklist__control" />

                    <span>{activity}</span>
                  </label>
                );
              })}
            </div>
          </section>

          <aside className="roadmap-stage__support">
            <div className="roadmap-support-card">
              <span className="roadmap-support-card__label">
                Portfolio project
              </span>

              <p>{stage.project}</p>
            </div>

            <div className="roadmap-support-card">
              <span className="roadmap-support-card__label">
                Suggested resources
              </span>

              <ul>
                {stage.resources.map((resource) => (
                  <li key={resource}>{resource}</li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      )}
    </article>
  );
}


// Build the personalised roadmap from the user's skills analysis 
function LearningRoadmap() {
  const [savedAnalysis] = useState(readLatestAnalysis);
  const [progress, setProgress] = useState(readSavedProgress);

  const missingSkills = useMemo(
    () => extractMissingSkills(savedAnalysis),
    [savedAnalysis],
  );

  const matchedSkills = useMemo(
    () => extractMatchedSkills(savedAnalysis),
    [savedAnalysis],
  );

  const detectedSkills = useMemo(
    () => extractDetectedSkills(savedAnalysis),
    [savedAnalysis],
  );

  const recommendation = useMemo(
    () => extractRecommendation(savedAnalysis),
    [savedAnalysis],
  );

  const roadmap = useMemo(
    () => buildRoadmap(missingSkills),
    [missingSkills],
  );

  const totalActivities = roadmap.reduce(
    (total, stage) => total + stage.activities.length,
    0,
  );

  const completedActivities = roadmap.reduce(
    (total, stage) =>
      total +
      stage.activities.filter(
        (_, activityIndex) =>
          progress[`${stage.id}-${activityIndex}`],
      ).length,
    0,
  );

  const overallProgress =
    totalActivities > 0
      ? Math.round((completedActivities / totalActivities) * 100)
      : 0;

  function updateStoredProgress(nextProgress) {
    try {
      localStorage.setItem(
        ROADMAP_PROGRESS_KEY,
        JSON.stringify(nextProgress),
      );
    } catch {
      
    }
  }

  function handleToggleActivity(progressKey) {
    setProgress((currentProgress) => {
      const nextProgress = {
        ...currentProgress,
        [progressKey]: !currentProgress[progressKey],
      };

      updateStoredProgress(nextProgress);
      return nextProgress;
    });
  }

  function handleResetProgress() {
    const confirmed = window.confirm(
      "Reset all completed learning activities?",
    );

    if (!confirmed) {
      return;
    }

    setProgress({});

    try {
      localStorage.removeItem(ROADMAP_PROGRESS_KEY);
    } catch {
      // Ignore storage errors because the visible state has already reset.
    }
  }

  if (!savedAnalysis) {
    return (
      <main className="roadmap-page roadmap-page--empty">
        <section className="roadmap-empty-state">
          <span className="roadmap-eyebrow">Learning roadmap</span>

          <div className="roadmap-empty-state__icon" aria-hidden="true">
            ◇
          </div>

          <h1>Create my learning plan</h1>

          <p>
            Complete a CV analysis first. CareerPilot AI  uses my 
            development areas to organise a practical learning
            roadmap.
          </p>

          <div className="roadmap-empty-state__actions">
            <Link className="roadmap-primary-button" to="/upload-cv">
              Analyse My CV
            </Link>

            <Link className="roadmap-secondary-button" to="/dashboard">
              Return to dashboard
            </Link>
          </div>
        </section>

        <LearningRoadmapStyles />
      </main>
    );
  }

  if (roadmap.length === 0) {
    return (
      <main className="roadmap-page roadmap-page--empty">
        <section className="roadmap-empty-state">
          <span className="roadmap-eyebrow">Roadmap complete</span>

          <div
            className="roadmap-empty-state__icon roadmap-empty-state__icon--success"
            aria-hidden="true"
          >
            ✓
          </div>

          <h1>No development gaps were identified</h1>

          <p>
            Your latest comparison did not return any missing skills. You can
            run another analysis using a more detailed job description or
            continue improving your detected skills.
          </p>

          {detectedSkills.length > 0 && (
            <div className="roadmap-empty-state__skills">
              {detectedSkills.map((skill) => (
                <SkillTag key={skill}>{formatSkillName(skill)}</SkillTag>
              ))}
            </div>
          )}

          <div className="roadmap-empty-state__actions">
            <Link className="roadmap-primary-button" to="/upload-cv">
              Run another analysis
            </Link>

            <Link className="roadmap-secondary-button" to="/dashboard">
              Return to dashboard
            </Link>
          </div>
        </section>

        <LearningRoadmapStyles />
      </main>
    );
  }

  return (
    <main className="roadmap-page">
      <header className="roadmap-hero">
        <div className="roadmap-hero__navigation">
          <Link to="/dashboard" className="roadmap-back-link">
            <span aria-hidden="true">←</span>
            Back to dashboard
          </Link>

          <span className="roadmap-brand-label">
            CareerPilot AI · Development intelligence
          </span>
        </div>

        <div className="roadmap-hero__content">
          <div>
            <span className="roadmap-eyebrow">Personal learning roadmap</span>

            <h1>
              Turn your skill gaps into a practical development plan.
            </h1>
          </div>

          <p>
            This roadmap is generated from the missing skills identified in
            your latest CV and job-description comparison. Complete each stage
            and use the suggested projects to demonstrate your progress.
          </p>
        </div>
      </header>

      <section className="roadmap-shell">
        <section className="roadmap-overview">
          <div className="roadmap-overview__copy">
            <span className="roadmap-eyebrow">Your current pathway</span>

            <h2>{recommendation.career}</h2>

            <p>
              Focus first on the highest-priority gaps, then reinforce your
              knowledge through practical portfolio evidence.
            </p>

            <div className="roadmap-overview__tags">
              {missingSkills.map((skill) => (
                <SkillTag key={skill} variant="priority">
                  {formatSkillName(skill)}
                </SkillTag>
              ))}
            </div>
          </div>

          <div className="roadmap-overview__progress">
            <ProgressRing percentage={overallProgress} />

            <div>
              <strong>
                {completedActivities} of {totalActivities}
              </strong>
              <span>activities completed</span>
            </div>
          </div>
        </section>

        <section className="roadmap-stat-grid" aria-label="Roadmap summary">
          <article className="roadmap-stat-card">
            <span>Development areas</span>
            <strong>{missingSkills.length}</strong>
            <p>Skills requiring further preparation.</p>
          </article>

          <article className="roadmap-stat-card">
            <span>Existing strengths</span>
            <strong>{matchedSkills.length}</strong>
            <p>Skills already matched to the target role.</p>
          </article>

          <article className="roadmap-stat-card">
            <span>Detected CV skills</span>
            <strong>{detectedSkills.length}</strong>
            <p>Capabilities identified from your uploaded CV.</p>
          </article>

          <article className="roadmap-stat-card">
            <span>Career compatibility</span>
            <strong>{recommendation.score}%</strong>
            <p>{recommendation.level || "Based on your latest analysis."}</p>
          </article>
        </section>

        <section className="roadmap-plan">
          <div className="roadmap-section-heading">
            <div>
              <span className="roadmap-eyebrow">Structured plan</span>
              <h2>My development plans</h2>
              <p>
                Work through one stage at a time. Your checklist progress is
                saved automatically in this browser.
              </p>
            </div>

            {completedActivities > 0 && (
              <button
                type="button"
                className="roadmap-text-button"
                onClick={handleResetProgress}
              >
                Reset progress
              </button>
            )}
          </div>

          <div className="roadmap-stage-list">
            {roadmap.map((stage, index) => (
              <RoadmapStage
                key={stage.id}
                stage={stage}
                progress={progress}
                onToggleActivity={handleToggleActivity}
                defaultExpanded={index === 0}
              />
            ))}
          </div>
        </section>

        <section className="roadmap-final-project">
          <div>
            <span className="roadmap-eyebrow">Final portfolio challenge</span>

            <h2>Combine your new skills in one evidence-based project</h2>

            <p>
              Select a realistic problem, apply the development areas from this
              roadmap and document your planning, implementation, testing and
              conclusions.
            </p>
          </div>

          <ol>
            <li>Define a clear problem and intended user.</li>
            <li>Apply at least two roadmap skills.</li>
            <li>Test the outcome and record limitations.</li>
            <li>Publish the work with clear documentation.</li>
          </ol>
        </section>
            {/* Navigation to another feature */}
        <footer className="roadmap-actions">
          <Link className="roadmap-secondary-button" to="/upload-cv">
            Run another analysis
          </Link>

          <Link
            className="roadmap-secondary-button"
            to="/job-comparison"
          >
            View job comparison
          </Link>

          <Link
            className="roadmap-secondary-button"
            to="/career-recommendations"
          >
            Career recommendations
          </Link>

          <Link className="roadmap-primary-button" to="/dashboard">
            Return to dashboard
          </Link>
        </footer>
      </section>

      <LearningRoadmapStyles />
    </main>
  );
}


// Component-local styles 
function LearningRoadmapStyles() {
  return (
    <style>{`
      .roadmap-page {
        min-height: 100vh;
        padding: 42px;
        color: #11182f;
        background:
          radial-gradient(circle at 50% 0%, rgba(68, 134, 255, 0.14), transparent 35%),
          linear-gradient(135deg, #f8f7ff 0%, #eef7ff 52%, #f7f5ff 100%);
      }

      .roadmap-page *,
      .roadmap-page *::before,
      .roadmap-page *::after {
        box-sizing: border-box;
      }

      .roadmap-hero,
      .roadmap-shell {
        width: min(1320px, 100%);
        margin-inline: auto;
      }

      .roadmap-hero {
        padding: 16px 0 38px;
      }

      .roadmap-hero__navigation {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 58px;
      }

      .roadmap-back-link {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        color: #11182f;
        font-weight: 750;
        text-decoration: none;
      }

      .roadmap-back-link:hover {
        color: #2867e8;
      }

      .roadmap-brand-label,
      .roadmap-eyebrow {
        color: #3378ea;
        font-size: 0.78rem;
        font-weight: 800;
        letter-spacing: 0.2em;
        text-transform: uppercase;
      }

      .roadmap-hero__content {
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
        align-items: end;
        gap: clamp(40px, 8vw, 120px);
      }

      .roadmap-hero h1 {
        max-width: 760px;
        margin: 18px 0 0;
        font-size: clamp(3rem, 6vw, 6.2rem);
        font-weight: 680;
        line-height: 0.95;
        letter-spacing: -0.065em;
      }

      .roadmap-hero__content > p {
        margin: 0;
        color: #657087;
        font-size: clamp(1.05rem, 1.7vw, 1.35rem);
        line-height: 1.75;
      }

      .roadmap-shell {
        overflow: hidden;
        border: 1px solid rgba(17, 24, 47, 0.1);
        border-radius: 34px;
        background: rgba(255, 255, 255, 0.92);
        box-shadow: 0 30px 90px rgba(42, 72, 130, 0.12);
      }

      .roadmap-overview {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 44px;
        padding: clamp(32px, 5vw, 68px);
        background:
          radial-gradient(circle at 80% 20%, rgba(73, 139, 255, 0.15), transparent 35%),
          linear-gradient(120deg, #fbf8ff, #eff8ff);
      }

      .roadmap-overview h2,
      .roadmap-section-heading h2,
      .roadmap-final-project h2 {
        margin: 12px 0;
        font-size: clamp(2rem, 3vw, 3.35rem);
        font-weight: 650;
        line-height: 1.05;
        letter-spacing: -0.045em;
      }

      .roadmap-overview p,
      .roadmap-section-heading p,
      .roadmap-final-project p {
        max-width: 760px;
        color: #68738a;
        font-size: 1.05rem;
        line-height: 1.75;
      }

      .roadmap-overview__tags,
      .roadmap-empty-state__skills {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 24px;
      }

      .roadmap-skill-tag {
        display: inline-flex;
        align-items: center;
        min-height: 38px;
        padding: 7px 15px;
        border: 1px solid #dfe6f2;
        border-radius: 999px;
        background: #f5f8fc;
        color: #27324a;
        font-size: 0.9rem;
        font-weight: 750;
      }

      .roadmap-skill-tag--priority {
        border-color: #f1d8b8;
        background: #fff3df;
        color: #98461d;
      }

      .roadmap-overview__progress {
        display: flex;
        align-items: center;
        gap: 20px;
        min-width: 260px;
        padding: 22px;
        border: 1px solid rgba(17, 24, 47, 0.1);
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.82);
      }

      .roadmap-overview__progress > div:last-child {
        display: grid;
        gap: 5px;
      }

      .roadmap-overview__progress strong {
        font-size: 1.35rem;
      }

      .roadmap-overview__progress span {
        color: #68738a;
      }

      .roadmap-progress-ring {
        position: relative;
        display: grid;
        flex: 0 0 108px;
        width: 108px;
        height: 108px;
        place-items: center;
      }

      .roadmap-progress-ring svg {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        transform: rotate(-90deg);
      }

      .roadmap-progress-ring circle {
        fill: none;
        stroke-width: 11;
      }

      .roadmap-progress-ring__track {
        stroke: #dce9fb;
      }

      .roadmap-progress-ring__value {
        stroke: #2d6eea;
        stroke-linecap: round;
        transition: stroke-dashoffset 250ms ease;
      }

      .roadmap-progress-ring strong {
        position: relative;
        font-size: 1.4rem;
      }

      .roadmap-stat-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 18px;
        padding: 34px clamp(28px, 5vw, 68px);
        border-top: 1px solid #e9edf3;
        border-bottom: 1px solid #e9edf3;
      }

      .roadmap-stat-card {
        min-height: 180px;
        padding: 25px;
        border: 1px solid #e0e4ea;
        border-radius: 22px;
        background: #ffffff;
      }

      .roadmap-stat-card span {
        color: #667188;
        font-size: 0.76rem;
        font-weight: 800;
        letter-spacing: 0.15em;
        text-transform: uppercase;
      }

      .roadmap-stat-card strong {
        display: block;
        margin: 14px 0;
        font-size: 2.8rem;
        letter-spacing: -0.05em;
      }

      .roadmap-stat-card p {
        margin: 0;
        color: #6f798e;
        line-height: 1.55;
      }

      .roadmap-plan {
        padding: clamp(34px, 5vw, 68px);
      }

      .roadmap-section-heading {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 30px;
        margin-bottom: 34px;
      }

      .roadmap-section-heading p {
        margin-bottom: 0;
      }

      .roadmap-text-button {
        border: 0;
        background: transparent;
        color: #a23636;
        font: inherit;
        font-weight: 750;
        cursor: pointer;
      }

      .roadmap-text-button:hover {
        text-decoration: underline;
      }

      .roadmap-stage-list {
        display: grid;
        gap: 18px;
      }

      .roadmap-stage {
        overflow: hidden;
        border: 1px solid #dfe4eb;
        border-radius: 24px;
        background: #fff;
      }

      .roadmap-stage__header {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 22px;
        width: 100%;
        padding: 26px;
        border: 0;
        background: transparent;
        color: inherit;
        text-align: left;
        cursor: pointer;
      }

      .roadmap-stage__header:hover {
        background: #fafcff;
      }

      .roadmap-stage__number {
        display: grid;
        width: 50px;
        height: 50px;
        place-items: center;
        border-radius: 16px;
        background: #2d6eea;
        color: white;
        font-weight: 850;
        box-shadow: 0 12px 24px rgba(45, 110, 234, 0.22);
      }

      .roadmap-stage__heading {
        display: grid;
        gap: 7px;
      }

      .roadmap-stage__eyebrow {
        color: #2d6eea;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }

      .roadmap-stage__heading strong {
        font-size: 1.35rem;
      }

      .roadmap-stage__heading > span:last-child {
        color: #69748a;
        line-height: 1.5;
      }

      .roadmap-stage__summary {
        display: flex;
        align-items: center;
        gap: 20px;
        color: #667188;
        font-weight: 700;
      }

      .roadmap-stage__summary span:last-child {
        font-size: 1.7rem;
      }

      .roadmap-stage__content {
        display: grid;
        grid-template-columns: minmax(0, 1.3fr) minmax(280px, 0.7fr);
        gap: 30px;
        padding: 0 26px 30px 98px;
        border-top: 1px solid #edf0f5;
      }

      .roadmap-stage__activities,
      .roadmap-stage__support {
        padding-top: 26px;
      }

      .roadmap-stage__activities h3 {
        margin: 0 0 18px;
        font-size: 1.05rem;
      }

      .roadmap-checklist {
        display: grid;
        gap: 10px;
      }

      .roadmap-checklist__item {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: center;
        gap: 12px;
        padding: 13px 15px;
        border: 1px solid #e3e7ee;
        border-radius: 14px;
        cursor: pointer;
      }

      .roadmap-checklist__item:hover {
        border-color: #b9cff5;
        background: #f8fbff;
      }

      .roadmap-checklist__item input {
        position: absolute;
        width: 1px;
        height: 1px;
        opacity: 0;
        pointer-events: none;
      }

      .roadmap-checklist__control {
        display: grid;
        width: 23px;
        height: 23px;
        place-items: center;
        border: 2px solid #b9c2d2;
        border-radius: 7px;
      }

      .roadmap-checklist__item.is-complete {
        border-color: #bde8ce;
        background: #f2fcf6;
        color: #256841;
      }

      .roadmap-checklist__item.is-complete .roadmap-checklist__control {
        border-color: #25a75c;
        background: #25a75c;
      }

      .roadmap-checklist__item.is-complete .roadmap-checklist__control::after {
        content: "✓";
        color: white;
        font-size: 0.8rem;
        font-weight: 900;
      }

      .roadmap-checklist__item.is-complete > span:last-child {
        text-decoration: line-through;
        text-decoration-thickness: 1px;
      }

      .roadmap-stage__support {
        display: grid;
        align-content: start;
        gap: 14px;
      }

      .roadmap-support-card {
        padding: 20px;
        border-radius: 18px;
        background: #f4f7fc;
      }

      .roadmap-support-card__label {
        color: #536078;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.14em;
        text-transform: uppercase;
      }

      .roadmap-support-card p {
        margin: 10px 0 0;
        line-height: 1.55;
      }

      .roadmap-support-card ul {
        margin: 12px 0 0;
        padding-left: 20px;
        color: #59657b;
        line-height: 1.7;
      }

      .roadmap-final-project {
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(300px, 0.65fr);
        gap: 50px;
        margin: 0 clamp(28px, 5vw, 68px);
        padding: clamp(30px, 4vw, 52px);
        border-radius: 26px;
        background:
          radial-gradient(circle at 100% 0%, rgba(76, 137, 255, 0.22), transparent 38%),
          linear-gradient(125deg, #faf7ff, #eaf6ff);
      }

      .roadmap-final-project ol {
        display: grid;
        gap: 12px;
        margin: 0;
        padding-left: 24px;
        color: #526077;
        line-height: 1.6;
      }

      .roadmap-final-project li::marker {
        color: #2d6eea;
        font-weight: 800;
      }

      .roadmap-actions {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
        padding: 34px clamp(28px, 5vw, 68px) clamp(32px, 5vw, 58px);
      }

      .roadmap-primary-button,
      .roadmap-secondary-button {
        display: inline-flex;
        min-height: 58px;
        align-items: center;
        justify-content: center;
        padding: 14px 20px;
        border-radius: 14px;
        font-weight: 800;
        text-align: center;
        text-decoration: none;
        transition:
          transform 150ms ease,
          box-shadow 150ms ease,
          border-color 150ms ease;
      }

      .roadmap-primary-button {
        border: 1px solid #2d6eea;
        background: #2d6eea;
        color: #fff;
        box-shadow: 0 14px 28px rgba(45, 110, 234, 0.2);
      }

      .roadmap-secondary-button {
        border: 1px solid #d6dce6;
        background: #fff;
        color: #182139;
      }

      .roadmap-primary-button:hover,
      .roadmap-secondary-button:hover {
        transform: translateY(-2px);
      }

      .roadmap-primary-button:hover {
        box-shadow: 0 18px 34px rgba(45, 110, 234, 0.27);
      }

      .roadmap-secondary-button:hover {
        border-color: #9ebbf1;
      }

      .roadmap-page--empty {
        display: grid;
        place-items: center;
      }

      .roadmap-empty-state {
        width: min(720px, 100%);
        padding: clamp(34px, 6vw, 70px);
        border: 1px solid rgba(17, 24, 47, 0.1);
        border-radius: 30px;
        background: rgba(255, 255, 255, 0.95);
        text-align: center;
        box-shadow: 0 30px 90px rgba(42, 72, 130, 0.13);
      }

      .roadmap-empty-state__icon {
        display: grid;
        width: 74px;
        height: 74px;
        margin: 28px auto;
        place-items: center;
        border-radius: 22px;
        background: #edf4ff;
        color: #2d6eea;
        font-size: 2.2rem;
        font-weight: 800;
      }

      .roadmap-empty-state__icon--success {
        background: #e9f9ef;
        color: #1ba356;
      }

      .roadmap-empty-state h1 {
        margin: 0;
        font-size: clamp(2.1rem, 5vw, 4rem);
        line-height: 1.05;
        letter-spacing: -0.05em;
      }

      .roadmap-empty-state > p {
        max-width: 590px;
        margin: 22px auto 0;
        color: #68738a;
        font-size: 1.05rem;
        line-height: 1.7;
      }

      .roadmap-empty-state__skills {
        justify-content: center;
      }

      .roadmap-empty-state__actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 14px;
        margin-top: 32px;
      }

      @media (max-width: 1050px) {
        .roadmap-stat-grid,
        .roadmap-actions {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .roadmap-stage__content {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 820px) {
        .roadmap-page {
          padding: 22px;
        }

        .roadmap-hero__navigation {
          align-items: flex-start;
          margin-bottom: 38px;
        }

        .roadmap-brand-label {
          max-width: 210px;
          text-align: right;
        }

        .roadmap-hero__content,
        .roadmap-overview,
        .roadmap-final-project {
          grid-template-columns: 1fr;
        }

        .roadmap-overview__progress {
          width: 100%;
        }

        .roadmap-stage__content {
          padding-left: 26px;
        }
      }

      @media (max-width: 600px) {
        .roadmap-page {
          padding: 12px;
        }

        .roadmap-hero h1 {
          font-size: clamp(2.65rem, 15vw, 4.4rem);
        }

        .roadmap-brand-label {
          display: none;
        }

        .roadmap-stat-grid,
        .roadmap-actions,
        .roadmap-empty-state__actions {
          grid-template-columns: 1fr;
        }

        .roadmap-overview,
        .roadmap-plan {
          padding: 28px 20px;
        }

        .roadmap-final-project {
          margin-inline: 20px;
          padding: 26px 20px;
        }

        .roadmap-stage__header {
          grid-template-columns: auto minmax(0, 1fr);
          padding: 20px;
        }

        .roadmap-stage__summary {
          grid-column: 2;
          justify-content: space-between;
        }

        .roadmap-stage__content {
          padding: 0 20px 24px;
        }

        .roadmap-section-heading {
          align-items: flex-start;
          flex-direction: column;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .roadmap-page *,
        .roadmap-page *::before,
        .roadmap-page *::after {
          scroll-behavior: auto !important;
          transition-duration: 0.01ms !important;
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
        }
      }
    `}</style>
  );
}

export default LearningRoadmap;