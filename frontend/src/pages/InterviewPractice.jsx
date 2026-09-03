import { useMemo, useState } from "react";
import { Link } from "react-router-dom";


//Storage configuration
const ANALYSIS_STORAGE_KEYS = [
  "careerPilotLatestAnalysis",
  "careerPilotAnalysis",
  "latestCVAnalysis",
];

const INTERVIEW_SESSION_KEY = "careerPilotInterviewPractice";


//General utilities
function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function firstDefined(...values) {
  return values.find(
    (value) => value !== undefined && value !== null,
  );
}

function safeArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[,;\n|]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function uniqueStrings(values) {
  const seen = new Set();

  return safeArray(values)
    .map((value) => String(value).trim())
    .filter(Boolean)
    .filter((value) => {
      const key = value.toLowerCase();

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
}

function formatSkillName(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function normalisePercentage(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  const percentage =
    numericValue > 0 && numericValue <= 1
      ? numericValue * 100
      : numericValue;

  return Math.min(100, Math.max(0, percentage));
}

function formatPercentage(value) {
  const percentage = normalisePercentage(value);

  return Number.isInteger(percentage)
    ? `${percentage}%`
    : `${percentage.toFixed(2)}%`;
}

function normaliseLevel(value, score) {
  const suppliedLevel = String(value || "").trim();

  if (suppliedLevel) {
    return suppliedLevel;
  }

  const percentage = normalisePercentage(score);

  if (percentage >= 75) {
    return "Strong match";
  }

  if (percentage >= 50) {
    return "Moderate match";
  }

  return "Low match";
}
// Questions are based on your latest analysis
function readLatestAnalysis() {
  if (typeof window === "undefined") {
    return null;
  }

  for (const key of ANALYSIS_STORAGE_KEYS) {
    try {
      const storedValue = window.localStorage.getItem(key);

      if (!storedValue) {
        continue;
      }

      const parsedValue = JSON.parse(storedValue);

      if (isPlainObject(parsedValue)) {
        return parsedValue;
      }
    } catch {
      
    }
  }

  return null;
}

function readSavedInterviewSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(
      INTERVIEW_SESSION_KEY,
    );

    if (!storedValue) {
      return null;
    }

    const parsedValue = JSON.parse(storedValue);

    return isPlainObject(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

function saveInterviewSession(session) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    INTERVIEW_SESSION_KEY,
    JSON.stringify(session),
  );
}

// Get AI guidance from the uploaded CV analysis
function getAIGuidance(rawAnalysis) {
  if (!isPlainObject(rawAnalysis)) {
    return {};
  }

  const nestedAnalysis = isPlainObject(rawAnalysis.analysis)
    ? rawAnalysis.analysis
    : {};

// look for where the AI guidance is stored
  const possibleGuidance = [
    rawAnalysis.ai_guidance,
    rawAnalysis.aiGuidance,
    nestedAnalysis.ai_guidance,
    nestedAnalysis.aiGuidance,
  ];

  return possibleGuidance.find(isPlainObject) || {};
}

// create Gemini interview questions 
function buildGeminiInterviewQuestions(rawQuestions) {
  if (!Array.isArray(rawQuestions)) {
    return [];
  }

  return rawQuestions
    .map((item, index) => {
      if (!isPlainObject(item)) {
        return null;
      }

      const prompt = String(
        firstDefined(item.question, item.prompt, ""),
      ).trim();

      if (!prompt) {
        return null;
      }

      const purpose = String(
        firstDefined(
          item.purpose,
          "Assesses your suitability and preparation for the role.",
        ),
      ).trim();

      const rawGuidance = firstDefined(
        item.answer_guidance,
        item.guidance,
        [],
      );

      const guidance = Array.isArray(rawGuidance)
        ? uniqueStrings(rawGuidance)
        : String(rawGuidance || "")
            .split(/\n|[•;|]/)
            .map((value) => value.trim())
            .filter(Boolean);

      return createQuestion({
        id: `gemini-question-${index + 1}`,
        category: String(
          firstDefined(item.category, "Gemini generated"),
        ).trim(),
        title: String(
          firstDefined(item.title, `Interview question ${index + 1}`),
        ).trim(),
        prompt,
        purpose,
        guidance:
          guidance.length > 0
            ? guidance
            : [
                "Use a specific example where possible.",
                "Explain what you personally did.",
                "Describe the result and what you learned.",
              ],
        exampleStructure: String(
          firstDefined(
            item.example_structure,
            item.exampleStructure,
            "Situation → Task → Action → Result → Reflection.",
          ),
        ).trim(),
        skill: String(firstDefined(item.skill, "")).trim(),
      });
    })
    .filter(Boolean);
}

// Analysis normalisation
function normaliseAnalysis(rawAnalysis) {
  if (!isPlainObject(rawAnalysis)) {
    return null;
  }

  const analysis = isPlainObject(rawAnalysis.analysis)
    ? rawAnalysis.analysis
    : rawAnalysis;

  const aiGuidance = getAIGuidance(rawAnalysis);

  const recommendation = isPlainObject(
    analysis.career_recommendation,
  )
    ? analysis.career_recommendation
    : isPlainObject(rawAnalysis.career_recommendation)
      ? rawAnalysis.career_recommendation
      : {};

  const cvSkills = uniqueStrings(
    firstDefined(
      analysis.cv_skills,
      analysis.detected_skills,
      rawAnalysis.cv_skills,
      rawAnalysis.detected_skills,
      [],
    ),
  );

  const matchedSkills = uniqueStrings(
    firstDefined(
      analysis.matched_skills,
      rawAnalysis.matched_skills,
      [],
    ),
  );

  const missingSkills = uniqueStrings(
    firstDefined(
      analysis.missing_skill_priority,
      analysis.missing_skills,
      rawAnalysis.missing_skill_priority,
      rawAnalysis.missing_skills,
      [],
    ),
  );

  const requiredSkills = uniqueStrings(
    firstDefined(
      analysis.required_skills,
      rawAnalysis.required_skills,
      [],
    ),
  );

  const recommendedCareer = String(
    firstDefined(
      recommendation.recommended_career,
      recommendation.career,
      analysis.recommended_career,
      rawAnalysis.recommended_career,
      "Your target role",
    ),
  ).trim();

  const matchScore = normalisePercentage(
    firstDefined(
      analysis.match_score,
      rawAnalysis.match_score,
      0,
    ),
  );

  const careerMatchScore = normalisePercentage(
    firstDefined(
      recommendation.career_match_score,
      recommendation.score,
      analysis.career_match_score,
      rawAnalysis.career_match_score,
      matchScore,
    ),
  );

  const matchLevel = normaliseLevel(
    firstDefined(
      analysis.match_level,
      rawAnalysis.match_level,
    ),
    matchScore,
  );

  const filename = String(
    firstDefined(
      rawAnalysis.filename,
      analysis.filename,
      "Uploaded CV",
    ),
  );

  const jobDescription = String(
    firstDefined(
      rawAnalysis.job_description,
      analysis.job_description,
      "",
    ),
  );

  return {
    filename,
    jobDescription,
    recommendedCareer: recommendedCareer || "Your target role",
    matchScore,
    careerMatchScore,
    matchLevel,
    cvSkills,
    matchedSkills,
    missingSkills,
    requiredSkills,
    aiGuidance,
    aiError: String(
      firstDefined(
        rawAnalysis.ai_error,
        analysis.ai_error,
        "",
      ),
    ).trim(),
  };
}

//Question generation
function createQuestion({
  id,
  category,
  title,
  prompt,
  purpose,
  guidance,
  exampleStructure,
  skill = "",
}) {
  return {
    id,
    category,
    title,
    prompt,
    purpose,
    guidance,
    exampleStructure,
    skill,
  };
}

function buildInterviewQuestions(analysis) {
  const role = analysis?.recommendedCareer || "your target role";

  const matchedSkills =
    analysis?.matchedSkills?.length > 0
      ? analysis.matchedSkills
      : analysis?.cvSkills || [];

  const missingSkills = analysis?.missingSkills || [];

  const strongestSkill =
    matchedSkills[0] ||
    analysis?.cvSkills?.[0] ||
    "problem solving";

  const secondStrongestSkill =
    matchedSkills[1] ||
    analysis?.cvSkills?.[1] ||
    "communication";

  const primaryGap =
    missingSkills[0] ||
    analysis?.requiredSkills?.[0] ||
    "a skill required by the role";

  const secondaryGap =
    missingSkills[1] ||
    analysis?.requiredSkills?.[1] ||
    "professional development";

  return [
    createQuestion({
      id: "introduction",
      category: "Opening",
      title: "Professional introduction",
      prompt: `Tell me about yourself and explain why you are interested in working as ${role}.`,
      purpose:
        "Tests your ability to present a focused professional summary and connect your background to the role.",
      guidance: [
        "Start with your current professional or educational position.",
        "Mention two or three experiences or strengths relevant to the role.",
        "Explain why the role interests you.",
        "Finish by showing what value you hope to contribute.",
      ],
      exampleStructure:
        "Present position → relevant experience → key strengths → motivation for the role.",
    }),

    createQuestion({
      id: "strength-example",
      category: "Competency",
      title: "Evidence of a key strength",
      prompt: `Describe a situation in which you successfully used ${formatSkillName(
        strongestSkill,
      )}.`,
      purpose:
        "Checks whether you can support a claimed CV skill with specific evidence.",
      guidance: [
        "Describe the situation and why it mattered.",
        "Explain the task or responsibility you personally held.",
        "Describe the actions you took.",
        "State the measurable or observable result.",
      ],
      exampleStructure:
        "Situation → Task → Action → Result → Learning.",
      skill: strongestSkill,
    }),

    createQuestion({
      id: "collaboration",
      category: "Behavioural",
      title: "Working with other people",
      prompt: `Give an example of how you used ${formatSkillName(
        secondStrongestSkill,
      )} while working with other people.`,
      purpose:
        "Assesses teamwork, communication, accountability and interpersonal awareness.",
      guidance: [
        "Explain who was involved and what the team needed to achieve.",
        "Clarify your personal contribution.",
        "Describe any challenge or disagreement.",
        "Explain how your approach helped the team.",
      ],
      exampleStructure:
        "Team objective → your responsibility → challenge → response → outcome.",
      skill: secondStrongestSkill,
    }),

    createQuestion({
      id: "skill-gap",
      category: "Development",
      title: "Addressing a skills gap",
      prompt: `Your latest analysis identified ${formatSkillName(
        primaryGap,
      )} as a development area. How would you improve this skill?`,
      purpose:
        "Tests self-awareness, honesty and your ability to create a realistic learning plan.",
      guidance: [
        "Acknowledge the current gap without being overly negative.",
        "Explain why the skill is important for the role.",
        "Present specific learning activities or practice tasks.",
        "Describe how you would demonstrate improvement.",
      ],
      exampleStructure:
        "Current position → importance → action plan → evidence of progress.",
      skill: primaryGap,
    }),

    createQuestion({
      id: "technical-scenario",
      category: "Technical",
      title: "Applying role knowledge",
      prompt: `Imagine you have been assigned a task in ${role} that requires ${formatSkillName(
        primaryGap,
      )}. How would you approach the task from beginning to end?`,
      purpose:
        "Evaluates your reasoning process even when you do not yet have extensive practical experience.",
      guidance: [
        "Clarify the expected outcome and constraints.",
        "Break the task into manageable stages.",
        "Explain the tools, information or people you would use.",
        "Describe how you would test or review the result.",
      ],
      exampleStructure:
        "Clarify → plan → implement → validate → communicate.",
      skill: primaryGap,
    }),

    createQuestion({
      id: "problem-solving",
      category: "Situational",
      title: "Managing an unexpected problem",
      prompt:
        "Tell me about a time when a task did not go according to plan. What did you do?",
      purpose:
        "Assesses resilience, judgement, ownership and structured problem solving.",
      guidance: [
        "Select a genuine example with a meaningful difficulty.",
        "Explain how you identified the cause.",
        "Describe the actions you personally took.",
        "Include the result and what you would do differently next time.",
      ],
      exampleStructure:
        "Problem → investigation → decision → action → result → reflection.",
    }),

    createQuestion({
      id: "priorities",
      category: "Situational",
      title: "Managing competing priorities",
      prompt:
        "How would you manage several important tasks that share the same deadline?",
      purpose:
        "Tests planning, prioritisation, communication and time-management skills.",
      guidance: [
        "Assess urgency, impact and dependencies.",
        "Break work into smaller tasks.",
        "Communicate early where expectations may conflict.",
        "Review progress and adapt the plan where necessary.",
      ],
      exampleStructure:
        "Assess → prioritise → schedule → communicate → review.",
    }),

    createQuestion({
      id: "learning",
      category: "Development",
      title: "Learning something unfamiliar",
      prompt: `Describe how you would learn ${formatSkillName(
        secondaryGap,
      )} quickly enough to use it in a real project.`,
      purpose:
        "Evaluates learning agility and your ability to move from theory to practical evidence.",
      guidance: [
        "Define the minimum knowledge required for the task.",
        "Use reliable learning resources.",
        "Practise through a small relevant project.",
        "Ask for feedback and improve the result.",
      ],
      exampleStructure:
        "Learning goal → resources → practice → feedback → application.",
      skill: secondaryGap,
    }),

    createQuestion({
      id: "quality",
      category: "Technical",
      title: "Maintaining quality",
      prompt: `How would you check that your work as ${role} is accurate, complete and suitable for its intended user?`,
      purpose:
        "Tests quality assurance, attention to detail and awareness of user requirements.",
      guidance: [
        "Restate the acceptance criteria.",
        "Check the work systematically.",
        "Test normal cases and possible failure cases.",
        "Seek review where appropriate.",
        "Document important decisions and limitations.",
      ],
      exampleStructure:
        "Requirements → checks → testing → review → documentation.",
    }),

    createQuestion({
      id: "motivation",
      category: "Closing",
      title: "Why should we select you?",
      prompt: `Why should we select you for this ${role} opportunity?`,
      purpose:
        "Assesses whether you can present a credible and role-specific value proposition.",
      guidance: [
        "Refer to strengths supported by evidence.",
        "Connect your abilities to the employer's likely needs.",
        "Acknowledge your willingness to keep developing.",
        "Finish confidently without making unsupported claims.",
      ],
      exampleStructure:
        "Relevant strengths → supporting evidence → contribution → growth mindset.",
    }),
  ];
}

//Session helpers
function createEmptySession(questionIds) {
  const answers = {};
  const scores = {};
  const completed = {};

  questionIds.forEach((questionId) => {
    answers[questionId] = "";
    scores[questionId] = 0;
    completed[questionId] = false;
  });

  return {
    answers,
    scores,
    completed,
    activeQuestionId: questionIds[0] || "",
    lastSavedAt: null,
  };
}

function restoreSession(questions) {
  const questionIds = questions.map((question) => question.id);
  const emptySession = createEmptySession(questionIds);
  const storedSession = readSavedInterviewSession();

  if (!storedSession) {
    return emptySession;
  }

  const restoredAnswers = { ...emptySession.answers };
  const restoredScores = { ...emptySession.scores };
  const restoredCompleted = { ...emptySession.completed };

  questionIds.forEach((questionId) => {
    if (typeof storedSession.answers?.[questionId] === "string") {
      restoredAnswers[questionId] =
        storedSession.answers[questionId];
    }

    const storedScore = Number(
      storedSession.scores?.[questionId],
    );

    if (Number.isFinite(storedScore)) {
      restoredScores[questionId] = Math.min(
        5,
        Math.max(0, storedScore),
      );
    }

    restoredCompleted[questionId] = Boolean(
      storedSession.completed?.[questionId],
    );
  });

  const activeQuestionId = questionIds.includes(
    storedSession.activeQuestionId,
  )
    ? storedSession.activeQuestionId
    : emptySession.activeQuestionId;

  return {
    answers: restoredAnswers,
    scores: restoredScores,
    completed: restoredCompleted,
    activeQuestionId,
    lastSavedAt:
      typeof storedSession.lastSavedAt === "string"
        ? storedSession.lastSavedAt
        : null,
  };
}

function getAnswerWordCount(answer) {
  const trimmedAnswer = String(answer || "").trim();

  if (!trimmedAnswer) {
    return 0;
  }

  return trimmedAnswer.split(/\s+/).length;
}

function getAnswerStatus(answer, completed) {
  const wordCount = getAnswerWordCount(answer);

  if (completed) {
    return "Completed";
  }

  if (wordCount >= 40) {
    return "Ready to review";
  }

  if (wordCount > 0) {
    return "In progress";
  }

  return "Not started";
}

function formatSavedTime(value) {
  if (!value) {
    return "Not saved yet";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Saved previously";
  }

  return parsedDate.toLocaleString();
}

// Small presentational components
function ProgressRing({ percentage }) {
  const safePercentage = Math.min(
    100,
    Math.max(0, Number(percentage) || 0),
  );

  return (
    <div
      className="interview-progress-ring"
      style={{
        "--interview-progress": `${safePercentage * 3.6}deg`,
      }}
      aria-label={`${safePercentage}% complete`}
    >
      <div className="interview-progress-ring__centre">
        <strong>{safePercentage}%</strong>
        <span>complete</span>
      </div>
    </div>
  );
}

function ScoreSelector({ value, onChange }) {
  return (
    <div
      className="interview-score-selector"
      role="radiogroup"
      aria-label="Self-assessment score"
    >
      {[1, 2, 3, 4, 5].map((score) => (
        <button
          key={score}
          type="button"
          className={
            value === score
              ? "interview-score-button is-selected"
              : "interview-score-button"
          }
          onClick={() => onChange(score)}
          aria-pressed={value === score}
          title={`${score} out of 5`}
        >
          {score}
        </button>
      ))}
    </div>
  );
}

function QuestionNavigationItem({
  question,
  number,
  answer,
  completed,
  active,
  onSelect,
}) {
  const status = getAnswerStatus(answer, completed);

  return (
    <button
      type="button"
      className={
        active
          ? "interview-question-nav__item is-active"
          : "interview-question-nav__item"
      }
      onClick={onSelect}
      aria-current={active ? "step" : undefined}
    >
      <span className="interview-question-nav__number">
        {completed ? "✓" : number}
      </span>

      <span className="interview-question-nav__content">
        <strong>{question.title}</strong>
        <small>{status}</small>
      </span>
    </button>
  );
}



function InterviewPractice() {
  const [analysis] = useState(() =>
    normaliseAnalysis(readLatestAnalysis()),
  );

  const questions = useMemo(() => {
    const geminiQuestions = buildGeminiInterviewQuestions(
      analysis?.aiGuidance?.interview_questions,
    );

    if (geminiQuestions.length > 0) {
      return geminiQuestions;
    }

    return buildInterviewQuestions(analysis);
  }, [analysis]);

  const [session, setSession] = useState(() =>
    restoreSession(questions),
  );

  const [saveMessage, setSaveMessage] = useState("");
  const [showGuidance, setShowGuidance] = useState(true);
  const [showResetConfirmation, setShowResetConfirmation] =
    useState(false);

  const activeQuestionIndex = Math.max(
    0,
    questions.findIndex(
      (question) =>
        question.id === session.activeQuestionId,
    ),
  );

  const activeQuestion =
    questions[activeQuestionIndex] || questions[0];

  const activeAnswer =
    session.answers[activeQuestion?.id] || "";

  const activeScore =
    session.scores[activeQuestion?.id] || 0;

  const completedCount = questions.filter(
    (question) => session.completed[question.id],
  ).length;

  const startedCount = questions.filter(
    (question) =>
      getAnswerWordCount(session.answers[question.id]) > 0,
  ).length;

  const totalQuestions = questions.length;

  const completionPercentage =
    totalQuestions === 0
      ? 0
      : Math.round(
          (completedCount / totalQuestions) * 100,
        );

  const scoredQuestions = questions.filter(
    (question) => session.scores[question.id] > 0,
  );

  const averageScore =
    scoredQuestions.length === 0
      ? 0
      : scoredQuestions.reduce(
          (total, question) =>
            total + session.scores[question.id],
          0,
        ) / scoredQuestions.length;

  const canMoveBack = activeQuestionIndex > 0;
  const canMoveForward =
    activeQuestionIndex < questions.length - 1;

  function updateSession(updater) {
    setSession((currentSession) => {
      const updatedSession =
        typeof updater === "function"
          ? updater(currentSession)
          : updater;

      return updatedSession;
    });

    setSaveMessage("");
  }

  function handleSelectQuestion(questionId) {
    updateSession((currentSession) => ({
      ...currentSession,
      activeQuestionId: questionId,
    }));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function handleAnswerChange(event) {
    const nextAnswer = event.target.value;

    updateSession((currentSession) => ({
      ...currentSession,
      answers: {
        ...currentSession.answers,
        [activeQuestion.id]: nextAnswer,
      },
      completed: {
        ...currentSession.completed,
        [activeQuestion.id]:
          currentSession.completed[activeQuestion.id] &&
          nextAnswer.trim().length > 0,
      },
    }));
  }

  function handleScoreChange(score) {
    updateSession((currentSession) => ({
      ...currentSession,
      scores: {
        ...currentSession.scores,
        [activeQuestion.id]: score,
      },
    }));
  }

  function handleToggleComplete() {
    const wordCount = getAnswerWordCount(activeAnswer);

    if (
      !session.completed[activeQuestion.id] &&
      wordCount < 20
    ) {
      setSaveMessage(
        "Add a little more detail before marking this answer as complete.",
      );
      return;
    }

    updateSession((currentSession) => ({
      ...currentSession,
      completed: {
        ...currentSession.completed,
        [activeQuestion.id]:
          !currentSession.completed[activeQuestion.id],
      },
    }));
  }

  function handleSaveSession() {
    const savedAt = new Date().toISOString();

    const nextSession = {
      ...session,
      lastSavedAt: savedAt,
    };

    try {
      saveInterviewSession(nextSession);
      setSession(nextSession);
      setSaveMessage(
        "Your interview-practice session has been saved in this browser.",
      );
    } catch {
      setSaveMessage(
        "The session could not be saved. Check your browser storage settings.",
      );
    }
  }

  function handleMoveQuestion(direction) {
    const nextIndex = Math.min(
      questions.length - 1,
      Math.max(0, activeQuestionIndex + direction),
    );

    handleSelectQuestion(questions[nextIndex].id);
  }
// controls reset session
  function handleResetSession() {
    const emptySession = createEmptySession(
      questions.map((question) => question.id),
    );

    try {
      window.localStorage.removeItem(INTERVIEW_SESSION_KEY);
    } catch {
      
    }

    setSession(emptySession);
    setSaveMessage("A new interview-practice session has started.");
    setShowResetConfirmation(false);
    setShowGuidance(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  if (!analysis) {
    return (
      <main className="interview-page">
        <section className="interview-empty-state">
          <span className="interview-eyebrow">
            Interview preparation
          </span>

          <h1>Complete a CV analysis first.</h1>

          <p>
            CareerPilot AI needs your latest CV and job-description
            comparison before it can personalise your interview
            questions.
          </p>

          <div className="interview-empty-state__actions">
            <Link
              className="interview-primary-button"
              to="/upload-cv"
            >
              Analyse my CV
            </Link>

            <Link
              className="interview-secondary-button"
              to="/dashboard"
            >
              Return to dashboard
            </Link>
          </div>
        </section>

        <InterviewPracticeStyles />
      </main>
    );
  }

  return (
    <main className="interview-page">
      <header className="interview-hero">
        <div className="interview-topbar">
          <Link
            className="interview-back-link"
            to="/dashboard"
          >
            <span aria-hidden="true">←</span>
            Back to dashboard
          </Link>

          <span className="interview-brand-label">
            CareerPilot AI · Interview intelligence
          </span>
        </div>

        <div className="interview-hero__grid">
          <div>
            <span className="interview-eyebrow">
              Personalised interview practice
            </span>

            <h1>
              Prepare stronger answers for your next interview.
            </h1>
          </div>

          <div className="interview-hero__summary">
            <p>
              Practise questions shaped around your recommended
              pathway, CV strengths and current development areas.
              Save your answers, assess your performance and refine
              your evidence before the real interview.
            </p>

            <div className="interview-role-chip">
              Preparing for
              <strong>{analysis.recommendedCareer}</strong>
            </div>

            <div className="interview-role-chip">
              Question source
              <strong>
                {analysis.aiGuidance?.interview_questions?.length
                  ? "Gemini AI"
                  : "Local fallback"}
              </strong>
            </div>
          </div>
        </div>
      </header>

      <section className="interview-overview">
        <div className="interview-overview__content">
          <span className="interview-eyebrow">
            Current practice session
          </span>

          <h2>{analysis.recommendedCareer}</h2>

          <p>
            Questions are based on your latest analysis of{" "}
            <strong>{analysis.filename}</strong>.
          </p>

          <div className="interview-overview__tags">
            <span>{analysis.matchLevel}</span>
            <span>
              {analysis.matchedSkills.length} matched skills
            </span>
            <span>
              {analysis.missingSkills.length} development areas
            </span>
          </div>
        </div>

        <div className="interview-overview__progress">
          <ProgressRing percentage={completionPercentage} />

          <div>
            <strong>
              {completedCount} of {totalQuestions}
            </strong>
            <span>questions completed</span>
            <small>
              {startedCount} question
              {startedCount === 1 ? "" : "s"} started
            </small>
          </div>
        </div>
      </section>
         {/* ten interview questions */}
      <section className="interview-stat-grid">
        <article className="interview-stat-card">
          <span>Interview questions</span>
          <strong>{totalQuestions}</strong>
          <p>
            Personalised behavioural, technical and situational
            prompts.
          </p>
        </article>

        <article className="interview-stat-card">
          <span>Answers completed</span>
          <strong>{completedCount}</strong>
          <p>
            Answers you have reviewed and marked as ready.
          </p>
        </article>

        <article className="interview-stat-card">
          <span>Average self-score</span>
          <strong>
            {averageScore > 0
              ? averageScore.toFixed(1)
              : "—"}
          </strong>
          <p>
            Your average confidence rating out of five.
          </p>
        </article>

        <article className="interview-stat-card">
          <span>Career compatibility</span>
          <strong>
            {formatPercentage(analysis.careerMatchScore)}
          </strong>
          <p>
            The career recommendation score from your latest
            analysis.
          </p>
        </article>
      </section>
        {/* Practice plan*/}
      <section className="interview-workspace">
        <aside
          className="interview-question-nav"
          aria-label="Interview questions"
        >
          <div className="interview-question-nav__header">
            <span className="interview-eyebrow">
              Practice plan
            </span>
            <h2>Questions</h2>
            <p>
              Select a question and build your response one stage at
              a time.
            </p>
          </div>
              {/* Creates one selectable navigation item for each interview question */}
          <div className="interview-question-nav__list">
            {questions.map((question, index) => (
              <QuestionNavigationItem
                key={question.id}
                question={question}
                number={index + 1}
                answer={session.answers[question.id]}
                completed={
                  session.completed[question.id]
                }
                active={
                  question.id === activeQuestion.id
                }
                onSelect={() =>
                  handleSelectQuestion(question.id)
                }
              />
            ))}
          </div>
        </aside>
        {/* Shows the current question number */}
        <article className="interview-practice-card">
          <div className="interview-question-heading">
            <div>
              <div className="interview-question-meta">
                <span>
                  Question {activeQuestionIndex + 1} of{" "}
                  {totalQuestions}
                </span>
                <span>{activeQuestion.category}</span>

                {activeQuestion.skill && (
                  <span>
                    {formatSkillName(activeQuestion.skill)}
                  </span>
                )}
              </div>

              <h2>{activeQuestion.title}</h2>
            </div>

            <span
              className={
                session.completed[activeQuestion.id]
                  ? "interview-status is-complete"
                  : "interview-status"
              }
            >
              {getAnswerStatus(
                activeAnswer,
                session.completed[activeQuestion.id],
              )}
            </span>
          </div>
              {/* Displays the interview questions for the user */}
          <div className="interview-prompt">
            <span>Interview question</span>
            <p>{activeQuestion.prompt}</p>
          </div>

          <div className="interview-purpose">
            <strong>What this question assesses</strong>
            <p>{activeQuestion.purpose}</p>
          </div>

          <div className="interview-answer-section">
            <div className="interview-answer-section__heading">
              <div>
                <label htmlFor="interview-answer">
                  Build your answer
                </label>
                <p>
                  Use a specific example and focus on what you
                  personally did.
                </p>
              </div>

              <span>
                {getAnswerWordCount(activeAnswer)} words
              </span>
            </div>

            <textarea
              id="interview-answer"
              className="interview-answer-textarea"
              value={activeAnswer}
              onChange={handleAnswerChange}
              maxLength={8000}
              placeholder="Write your answer here. A strong response normally explains the situation, your responsibility, the actions you took and the result..."
            />

            <div className="interview-character-count">
              {activeAnswer.length.toLocaleString()} / 8,000
              characters
            </div>
          </div>

          <div className="interview-guidance">
            <button
              type="button"
              className="interview-guidance__toggle"
              onClick={() =>
                setShowGuidance(
                  (currentValue) => !currentValue,
                )
              }
              aria-expanded={showGuidance}
            >
              <span>
                {showGuidance ? "−" : "+"}
              </span>

              Answer guidance
            </button>

            {showGuidance && (
              <div className="interview-guidance__content">
                <div>
                  <h3>Suggested structure</h3>
                  <p>{activeQuestion.exampleStructure}</p>
                </div>

                <div>
                  <h3>Points to include</h3>
                  <ul>
                    {activeQuestion.guidance.map(
                      (guidanceItem) => (
                        <li key={guidanceItem}>
                          {guidanceItem}
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>

          <div className="interview-self-assessment">
            <div>
              <span className="interview-eyebrow">
                Self-assessment
              </span>

              <h3>How confident are you in this answer?</h3>

              <p>
                Score the answer after reviewing its relevance,
                evidence, structure and clarity.
              </p>
            </div>

            <div className="interview-self-assessment__score">
              <ScoreSelector
                value={activeScore}
                onChange={handleScoreChange}
              />

              <small>
                {activeScore === 0
                  ? "Not scored"
                  : `${activeScore} out of 5`}
              </small>
            </div>
          </div>

          {saveMessage && (
            <div
              className="interview-message"
              role="status"
              aria-live="polite"
            >
              {saveMessage}
            </div>
          )}

          <div className="interview-question-actions">
            <button
              type="button"
              className="interview-secondary-button"
              onClick={() => handleMoveQuestion(-1)}
              disabled={!canMoveBack}
            >
              Previous question
            </button>

            <button
              type="button"
              className={
                session.completed[activeQuestion.id]
                  ? "interview-complete-button is-complete"
                  : "interview-complete-button"
              }
              onClick={handleToggleComplete}
            >
              {session.completed[activeQuestion.id]
                ? "Mark as incomplete"
                : "Mark answer complete"}
            </button>

            <button
              type="button"
              className="interview-primary-button"
              onClick={() => handleMoveQuestion(1)}
              disabled={!canMoveForward}
            >
              Next question
            </button>
          </div>
        </article>
      </section>
      {/* Shows the session summary */}
      <section className="interview-summary-section">
        <div className="interview-summary-section__heading">
          <div>
            <span className="interview-eyebrow">
              Session summary
            </span>
            <h2>Review your preparation</h2>
          </div>

          <p>
            Your answers remain private in your browser unless you
            remove the saved session.
          </p>
        </div>
        {/* Shows the percentage of interview questions completed */}
        <div className="interview-summary-grid">
          <article>
            <span>Completion</span>
            <strong>{completionPercentage}%</strong>
            <div className="interview-linear-progress">
              <span
                style={{
                  width: `${completionPercentage}%`,
                }}
              />
            </div>
          </article>

          <article>
            <span>Questions started</span>
            <strong>
              {startedCount} / {totalQuestions}
            </strong>
            <p>
              Continue any partially written responses before your
              interview.
            </p>
          </article>

          <article>
            <span>Last saved</span>
            <strong>
              {session.lastSavedAt ? "Saved" : "Not saved"}
            </strong>
            <p>{formatSavedTime(session.lastSavedAt)}</p>
          </article>
        </div>
        {/* Saves the current interview practice session */}
        <div className="interview-summary-actions">
          <button
            type="button"
            className="interview-primary-button"
            onClick={handleSaveSession}
          >
            Save practice session
          </button>

          <Link
            className="interview-secondary-button"
            to="/learning-roadmap"
          >
            Open learning roadmap
          </Link>

          <Link
            className="interview-secondary-button"
            to="/job-comparison"
          >
            View job comparison
          </Link>

          <button
            type="button"
            className="interview-danger-button"
            onClick={() =>
              setShowResetConfirmation(true)
            }
          >
            Start a new session
          </button>
        </div>

        {showResetConfirmation && (
          <div
            className="interview-reset-confirmation"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="reset-session-title"
          >
            <div>
              <h3 id="reset-session-title">
                Reset the interview session?
              </h3>

              <p>
                This will remove all saved answers, completion
                statuses and self-assessment scores.
              </p>
            </div>

            <div>
              <button
                type="button"
                className="interview-secondary-button"
                onClick={() =>
                  setShowResetConfirmation(false)
                }
              >
                Keep my answers
              </button>

              <button
                type="button"
                className="interview-danger-button"
                onClick={handleResetSession}
              >
                Reset session
              </button>
            </div>
          </div>
        )}
      </section>

      <footer className="interview-footer-actions">
        <Link
          className="interview-secondary-button"
          to="/upload-cv"
        >
          Run another CV analysis
        </Link>

        <Link
          className="interview-secondary-button"
          to="/career-recommendations"
        >
          Career recommendations
        </Link>

        <Link
          className="interview-primary-button"
          to="/dashboard"
        >
          Return to dashboard
        </Link>
      </footer>

      <InterviewPracticeStyles />
    </main>
  );
}

//Scoped page styles

function InterviewPracticeStyles() {
  return (
    <style>{`
      .interview-page,
      .interview-page * {
        box-sizing: border-box;
      }

      .interview-page {
        --interview-ink: #0b1734;
        --interview-muted: #68758d;
        --interview-border: rgba(25, 47, 85, 0.14);
        --interview-blue: #2868ed;
        --interview-blue-dark: #174fc5;
        --interview-blue-soft: #edf4ff;
        --interview-green: #11864b;
        --interview-green-soft: #e8f8ef;
        --interview-red: #b42318;
        --interview-red-soft: #fff1ef;
        --interview-surface: #ffffff;
        --interview-background: #f5f6ff;
        min-height: 100vh;
        padding: 34px;
        color: var(--interview-ink);
        background:
          radial-gradient(
            circle at 50% 0%,
            rgba(99, 165, 255, 0.18),
            transparent 34rem
          ),
          linear-gradient(
            135deg,
            #f8f7ff 0%,
            #eef7ff 52%,
            #f6f4ff 100%
          );
      }

      .interview-page button,
      .interview-page textarea {
        font: inherit;
      }

      .interview-page button,
      .interview-page a {
        -webkit-tap-highlight-color: transparent;
      }

      .interview-hero,
      .interview-overview,
      .interview-stat-grid,
      .interview-workspace,
      .interview-summary-section,
      .interview-footer-actions {
        width: min(1420px, 100%);
        margin-inline: auto;
      }

      .interview-hero {
        padding: 22px 10px 40px;
      }

      .interview-topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 54px;
      }

      .interview-back-link {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        color: var(--interview-ink);
        font-weight: 800;
        text-decoration: none;
      }

      .interview-back-link:hover {
        color: var(--interview-blue);
      }

      .interview-brand-label,
      .interview-eyebrow {
        color: var(--interview-blue);
        font-size: 0.78rem;
        font-weight: 900;
        letter-spacing: 0.22em;
        text-transform: uppercase;
      }

      .interview-hero__grid {
        display: grid;
        grid-template-columns: minmax(0, 1.1fr) minmax(320px, 0.9fr);
        gap: clamp(36px, 8vw, 120px);
        align-items: end;
      }

      .interview-hero h1 {
        max-width: 820px;
        margin: 24px 0 0;
        font-size: clamp(3.3rem, 7vw, 6.6rem);
        line-height: 0.94;
        letter-spacing: -0.072em;
      }

      .interview-hero__summary {
        padding-bottom: 12px;
      }

      .interview-hero__summary p {
        margin: 0;
        color: var(--interview-muted);
        font-size: clamp(1.05rem, 1.6vw, 1.35rem);
        line-height: 1.75;
      }

      .interview-role-chip {
        display: inline-flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 28px;
        padding: 12px 16px;
        border: 1px solid rgba(40, 104, 237, 0.18);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.7);
        color: var(--interview-muted);
      }

      .interview-role-chip strong {
        color: var(--interview-ink);
      }

      .interview-overview {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 36px;
        align-items: center;
        padding: clamp(30px, 5vw, 58px);
        border: 1px solid var(--interview-border);
        border-radius: 32px;
        background:
          linear-gradient(
            120deg,
            rgba(255, 255, 255, 0.94),
            rgba(229, 242, 255, 0.92)
          );
        box-shadow: 0 24px 70px rgba(43, 68, 118, 0.11);
      }

      .interview-overview h2 {
        margin: 15px 0 12px;
        font-size: clamp(2rem, 4vw, 4rem);
        letter-spacing: -0.045em;
      }

      .interview-overview p {
        color: var(--interview-muted);
        line-height: 1.7;
      }

      .interview-overview__tags {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 24px;
      }

      .interview-overview__tags span {
        padding: 9px 14px;
        border: 1px solid var(--interview-border);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.75);
        font-weight: 750;
      }

      .interview-overview__progress {
        display: flex;
        align-items: center;
        gap: 22px;
        min-width: 350px;
        padding: 24px;
        border: 1px solid var(--interview-border);
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.82);
      }

      .interview-overview__progress > div:last-child {
        display: grid;
        gap: 5px;
      }

      .interview-overview__progress strong {
        font-size: 1.45rem;
      }

      .interview-overview__progress span,
      .interview-overview__progress small {
        color: var(--interview-muted);
      }

      .interview-progress-ring {
        display: grid;
        flex: 0 0 118px;
        width: 118px;
        height: 118px;
        padding: 11px;
        place-items: center;
        border-radius: 50%;
        background:
          conic-gradient(
            var(--interview-blue) var(--interview-progress),
            #dce8f8 0
          );
      }

      .interview-progress-ring__centre {
        display: grid;
        width: 100%;
        height: 100%;
        place-content: center;
        text-align: center;
        border-radius: 50%;
        background: white;
      }

      .interview-progress-ring__centre strong {
        font-size: 1.6rem;
      }

      .interview-progress-ring__centre span {
        margin-top: 3px;
        color: var(--interview-muted);
        font-size: 0.75rem;
      }
      /* Arranges the interview card into four equal sizes */
      .interview-stat-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 18px;
        margin-top: 22px;
      }

      .interview-stat-card {
        min-height: 230px;
        padding: 30px;
        border: 1px solid var(--interview-border);
        border-radius: 25px;
        background: rgba(255, 255, 255, 0.88);
      }

      .interview-stat-card span {
        color: var(--interview-muted);
        font-size: 0.82rem;
        font-weight: 850;
        letter-spacing: 0.13em;
        text-transform: uppercase;
      }

      .interview-stat-card strong {
        display: block;
        margin: 22px 0 20px;
        font-size: clamp(2.5rem, 4vw, 4.3rem);
        letter-spacing: -0.055em;
      }
      /* Styles the supporting description underneath each statistic */
      .interview-stat-card p {
        margin: 0;
        color: var(--interview-muted);
        line-height: 1.6;
      }
      /* Creates layout for the question list and answer */
      .interview-workspace {
        display: grid;
        grid-template-columns: 360px minmax(0, 1fr);
        gap: 22px;
        margin-top: 22px;
        align-items: start;
      }

      .interview-question-nav,
      .interview-practice-card,
      .interview-summary-section {
        border: 1px solid var(--interview-border);
        border-radius: 30px;
        background: rgba(255, 255, 255, 0.93);
        box-shadow: 0 18px 55px rgba(43, 68, 118, 0.08);
      }

      .interview-question-nav {
        position: sticky;
        top: 24px;
        max-height: calc(100vh - 48px);
        overflow: auto;
      }

      .interview-question-nav__header {
        padding: 28px 26px 20px;
      }

      .interview-question-nav__header h2 {
        margin: 10px 0 8px;
        font-size: 2rem;
      }

      .interview-question-nav__header p {
        margin: 0;
        color: var(--interview-muted);
        line-height: 1.55;
      }

      .interview-question-nav__list {
        display: grid;
        gap: 8px;
        padding: 8px 14px 20px;
      }

      .interview-question-nav__item {
        display: grid;
        grid-template-columns: 42px minmax(0, 1fr);
        gap: 13px;
        align-items: center;
        width: 100%;
        padding: 14px;
        border: 1px solid transparent;
        border-radius: 17px;
        text-align: left;
        color: var(--interview-ink);
        background: transparent;
        cursor: pointer;
      }

      .interview-question-nav__item:hover {
        background: #f5f8ff;
      }

      .interview-question-nav__item.is-active {
        border-color: rgba(40, 104, 237, 0.24);
        background: var(--interview-blue-soft);
      }
      /* Styles the numbers displayed beside each interview question */
      .interview-question-nav__number {
        display: grid;
        width: 42px;
        height: 42px;
        place-items: center;
        border-radius: 14px;
        color: var(--interview-blue);
        background: white;
        box-shadow: 0 5px 15px rgba(40, 104, 237, 0.12);
        font-weight: 850;
      }

      .interview-question-nav__content {
        display: grid;
        gap: 4px;
        min-width: 0;
      }

      .interview-question-nav__content strong {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .interview-question-nav__content small {
        color: var(--interview-muted);
      }

      .interview-practice-card {
        padding: clamp(24px, 4vw, 48px);
      }

      .interview-question-heading {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 24px;
      }

      .interview-question-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .interview-question-meta span {
        padding: 7px 11px;
        border-radius: 999px;
        color: var(--interview-blue-dark);
        background: var(--interview-blue-soft);
        font-size: 0.76rem;
        font-weight: 850;
      }

      .interview-question-heading h2 {
        margin: 18px 0 0;
        font-size: clamp(2rem, 3vw, 3.25rem);
        letter-spacing: -0.045em;
      }

      .interview-status {
        flex: 0 0 auto;
        padding: 9px 13px;
        border-radius: 999px;
        color: #7d4e00;
        background: #fff4d8;
        font-size: 0.8rem;
        font-weight: 850;
      }

      .interview-status.is-complete {
        color: var(--interview-green);
        background: var(--interview-green-soft);
      }

      .interview-prompt {
        margin-top: 34px;
        padding: 28px;
        border-radius: 22px;
        background:
          linear-gradient(
            135deg,
            #f6f4ff,
            #eef8ff
          );
      }

      .interview-prompt span {
        color: var(--interview-blue);
        font-size: 0.77rem;
        font-weight: 900;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      .interview-prompt p {
        margin: 14px 0 0;
        font-size: clamp(1.3rem, 2vw, 1.85rem);
        font-weight: 760;
        line-height: 1.45;
      }

      .interview-purpose {
        display: grid;
        gap: 7px;
        margin-top: 22px;
        padding: 20px 22px;
        border-left: 4px solid var(--interview-blue);
        background: #f8faff;
      }

      .interview-purpose p {
        margin: 0;
        color: var(--interview-muted);
        line-height: 1.65;
      }

      .interview-answer-section {
        margin-top: 34px;
      }

      .interview-answer-section__heading {
        display: flex;
        justify-content: space-between;
        gap: 20px;
        margin-bottom: 14px;
      }

      .interview-answer-section__heading label {
        display: block;
        font-size: 1.25rem;
        font-weight: 850;
      }

      .interview-answer-section__heading p {
        margin: 7px 0 0;
        color: var(--interview-muted);
      }

      .interview-answer-section__heading > span {
        color: var(--interview-muted);
        font-size: 0.9rem;
        white-space: nowrap;
      }

      .interview-answer-textarea {
        width: 100%;
        min-height: 330px;
        resize: vertical;
        padding: 22px;
        border: 1px solid rgba(25, 47, 85, 0.22);
        border-radius: 18px;
        outline: none;
        color: var(--interview-ink);
        background: #ffffff;
        font-size: 1rem;
        line-height: 1.75;
        transition:
          border-color 160ms ease,
          box-shadow 160ms ease;
      }

      .interview-answer-textarea:focus {
        border-color: var(--interview-blue);
        box-shadow: 0 0 0 4px rgba(40, 104, 237, 0.12);
      }

      .interview-character-count {
        margin-top: 8px;
        color: var(--interview-muted);
        font-size: 0.84rem;
        text-align: right;
      }

      .interview-guidance {
        margin-top: 24px;
        overflow: hidden;
        border: 1px solid var(--interview-border);
        border-radius: 19px;
      }

      .interview-guidance__toggle {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 18px 20px;
        border: 0;
        color: var(--interview-ink);
        background: #f8faff;
        font-weight: 850;
        cursor: pointer;
      }

      .interview-guidance__toggle span {
        display: grid;
        width: 28px;
        height: 28px;
        place-items: center;
        border-radius: 9px;
        color: var(--interview-blue);
        background: white;
      }

      .interview-guidance__content {
        display: grid;
        grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
        gap: 24px;
        padding: 24px;
        background: white;
      }

      .interview-guidance__content h3 {
        margin: 0 0 10px;
      }

      .interview-guidance__content p,
      .interview-guidance__content li {
        color: var(--interview-muted);
        line-height: 1.65;
      }

      .interview-guidance__content p {
        margin: 0;
      }

      .interview-guidance__content ul {
        margin: 0;
        padding-left: 20px;
      }

      .interview-self-assessment {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 30px;
        margin-top: 24px;
        padding: 25px;
        border-radius: 22px;
        background: #f6f9ff;
      }

      .interview-self-assessment h3 {
        margin: 9px 0 7px;
        font-size: 1.3rem;
      }

      .interview-self-assessment p {
        margin: 0;
        color: var(--interview-muted);
        line-height: 1.55;
      }

      .interview-self-assessment__score {
        display: grid;
        justify-items: end;
        gap: 8px;
      }

      .interview-score-selector {
        display: flex;
        gap: 7px;
      }

      .interview-score-button {
        width: 42px;
        height: 42px;
        border: 1px solid var(--interview-border);
        border-radius: 12px;
        color: var(--interview-muted);
        background: white;
        font-weight: 850;
        cursor: pointer;
      }

      .interview-score-button:hover,
      .interview-score-button.is-selected {
        border-color: var(--interview-blue);
        color: white;
        background: var(--interview-blue);
      }

      .interview-self-assessment__score small {
        color: var(--interview-muted);
      }

      .interview-message {
        margin-top: 20px;
        padding: 14px 17px;
        border: 1px solid rgba(40, 104, 237, 0.2);
        border-radius: 14px;
        color: var(--interview-blue-dark);
        background: var(--interview-blue-soft);
        line-height: 1.5;
      }

      .interview-question-actions,
      .interview-summary-actions,
      .interview-footer-actions,
      .interview-empty-state__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
      }

      .interview-question-actions {
        margin-top: 30px;
      }

      .interview-primary-button,
      .interview-secondary-button,
      .interview-complete-button,
      .interview-danger-button {
        display: inline-flex;
        min-height: 52px;
        align-items: center;
        justify-content: center;
        padding: 13px 20px;
        border-radius: 14px;
        font-weight: 850;
        text-align: center;
        text-decoration: none;
        cursor: pointer;
        transition:
          transform 150ms ease,
          box-shadow 150ms ease,
          background-color 150ms ease;
      }

      .interview-primary-button {
        border: 1px solid var(--interview-blue);
        color: white;
        background: var(--interview-blue);
        box-shadow: 0 12px 25px rgba(40, 104, 237, 0.19);
      }

      .interview-primary-button:hover {
        background: var(--interview-blue-dark);
        transform: translateY(-1px);
      }

      .interview-secondary-button {
        border: 1px solid var(--interview-border);
        color: var(--interview-ink);
        background: white;
      }

      .interview-secondary-button:hover {
        border-color: rgba(40, 104, 237, 0.35);
        color: var(--interview-blue-dark);
        background: #f8faff;
      }

      .interview-complete-button {
        border: 1px solid rgba(17, 134, 75, 0.24);
        color: var(--interview-green);
        background: var(--interview-green-soft);
      }

      .interview-complete-button.is-complete {
        color: white;
        background: var(--interview-green);
      }

      .interview-danger-button {
        border: 1px solid rgba(180, 35, 24, 0.2);
        color: var(--interview-red);
        background: var(--interview-red-soft);
      }

      .interview-primary-button:disabled,
      .interview-secondary-button:disabled {
        cursor: not-allowed;
        opacity: 0.45;
        transform: none;
        box-shadow: none;
      }

      .interview-question-actions > * {
        flex: 1 1 190px;
      }

      .interview-summary-section {
        margin-top: 22px;
        padding: clamp(26px, 4vw, 48px);
      }

      .interview-summary-section__heading {
        display: flex;
        justify-content: space-between;
        gap: 30px;
        align-items: end;
      }
      /* Styles the main session */
      .interview-summary-section__heading h2 {
        margin: 12px 0 0;
        font-size: clamp(2rem, 4vw, 3.8rem);
        letter-spacing: -0.05em;
      }

      .interview-summary-section__heading > p {
        max-width: 470px;
        margin: 0;
        color: var(--interview-muted);
        line-height: 1.65;
      }

      .interview-summary-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 16px;
        margin-top: 30px;
      }

      .interview-summary-grid article {
        min-height: 180px;
        padding: 24px;
        border: 1px solid var(--interview-border);
        border-radius: 20px;
      }

      .interview-summary-grid article > span {
        color: var(--interview-muted);
        font-weight: 800;
      }

      .interview-summary-grid article > strong {
        display: block;
        margin: 16px 0;
        font-size: 2.2rem;
      }

      .interview-summary-grid p {
        margin: 0;
        color: var(--interview-muted);
        line-height: 1.55;
      }

      .interview-linear-progress {
        height: 10px;
        overflow: hidden;
        border-radius: 999px;
        background: #e2eaf6;
      }

      .interview-linear-progress span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(
          90deg,
          var(--interview-blue),
          #61b2ff
        );
      }

      .interview-summary-actions {
        margin-top: 24px;
      }

      .interview-summary-actions > * {
        flex: 1 1 220px;
      }

      .interview-reset-confirmation {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 30px;
        margin-top: 22px;
        padding: 22px;
        border: 1px solid rgba(180, 35, 24, 0.2);
        border-radius: 18px;
        background: var(--interview-red-soft);
      }

      .interview-reset-confirmation h3 {
        margin: 0 0 6px;
      }

      .interview-reset-confirmation p {
        margin: 0;
        color: #7a3833;
        line-height: 1.5;
      }

      .interview-reset-confirmation > div:last-child {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .interview-footer-actions {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 14px;
        padding: 22px 0 50px;
      }

      .interview-empty-state {
        width: min(800px, 100%);
        margin: 10vh auto;
        padding: clamp(32px, 7vw, 72px);
        border: 1px solid var(--interview-border);
        border-radius: 30px;
        background: white;
        text-align: center;
        box-shadow: 0 24px 70px rgba(43, 68, 118, 0.12);
      }

      .interview-empty-state h1 {
        margin: 20px 0;
        font-size: clamp(2.5rem, 6vw, 5rem);
        line-height: 1;
        letter-spacing: -0.06em;
      }

      .interview-empty-state p {
        max-width: 600px;
        margin: 0 auto;
        color: var(--interview-muted);
        font-size: 1.1rem;
        line-height: 1.7;
      }

      /* Creates three column layout for session summary cards */
      .interview-empty-state__actions {
        justify-content: center;
        margin-top: 30px;
      }

      @media (max-width: 1120px) {
        .interview-stat-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .interview-workspace {
          grid-template-columns: 1fr;
        }

        .interview-question-nav {
          position: static;
          max-height: none;
        }

        .interview-question-nav__list {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 850px) {
        .interview-page {
          padding: 20px;
        }

        .interview-hero__grid,
        .interview-overview {
          grid-template-columns: 1fr;
        }

        .interview-overview__progress {
          width: 100%;
          min-width: 0;
        }

        .interview-guidance__content,
        .interview-summary-grid {
          grid-template-columns: 1fr;
        }

        .interview-summary-section__heading,
        .interview-self-assessment,
        .interview-reset-confirmation {
          align-items: stretch;
          flex-direction: column;
        }

        .interview-self-assessment__score {
          justify-items: start;
        }

        .interview-footer-actions {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 600px) {
        .interview-page {
          padding: 12px;
        }

        .interview-topbar {
          align-items: flex-start;
          flex-direction: column;
          margin-bottom: 36px;
        }

        .interview-brand-label {
          line-height: 1.6;
        }

        .interview-hero h1 {
          font-size: clamp(3rem, 16vw, 4.6rem);
        }

        .interview-overview,
        .interview-question-nav,
        .interview-practice-card,
        .interview-summary-section {
          border-radius: 22px;
        }

        .interview-overview__progress {
          align-items: flex-start;
          flex-direction: column;
        }

        .interview-stat-grid,
        .interview-question-nav__list {
          grid-template-columns: 1fr;
        }

        .interview-stat-card {
          min-height: 0;
        }

        .interview-question-heading,
        .interview-answer-section__heading {
          align-items: flex-start;
          flex-direction: column;
        }

        .interview-answer-textarea {
          min-height: 280px;
        }

        .interview-question-actions {
          display: grid;
          grid-template-columns: 1fr;
        }

        .interview-question-actions > * {
          width: 100%;
        }

        .interview-score-selector {
          flex-wrap: wrap;
        }

        .interview-summary-actions {
          display: grid;
          grid-template-columns: 1fr;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .interview-page *,
        .interview-page *::before,
        .interview-page *::after {
          scroll-behavior: auto !important;
          transition-duration: 0.01ms !important;
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
        }
      }
    `}</style>
  );
}

export default InterviewPractice;