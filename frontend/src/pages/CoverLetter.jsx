import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const ANALYSIS_STORAGE_KEYS = [
  "careerPilotLatestAnalysis",
  "careerPilotAnalysis",
  "latestCVAnalysis",
];

const COVER_LETTER_STORAGE_KEY = "careerPilotCoverLetterDraft";

const EMPTY_FORM = {
  applicantName: "",
  applicantEmail: "",
  applicantPhone: "",
  hiringManager: "",
  companyName: "",
  jobTitle: "",
  location: "",
  tone: "professional",
  additionalDetails: "",
};

const TONE_OPTIONS = [
  {
    value: "professional",
    label: "Professional",
  },
  {
    value: "confident",
    label: "Confident",
  },
  {
    value: "concise",
    label: "Concise",
  },
];

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

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

function readLatestAnalysis() {
  if (typeof window === "undefined") {
    return null;
  }

  for (const storageKey of ANALYSIS_STORAGE_KEYS) {
    const storedValue = safelyParseJSON(localStorage.getItem(storageKey));

    if (isObject(storedValue)) {
      return storedValue;
    }
  }

  return null;
}

function getAIGuidance(analysis) {
  if (!isObject(analysis)) {
    return {};
  }

  const nestedAnalysis = isObject(analysis.analysis)
    ? analysis.analysis
    : {};

  const possibleGuidance = [
    analysis.ai_guidance,
    analysis.aiGuidance,
    nestedAnalysis.ai_guidance,
    nestedAnalysis.aiGuidance,
  ];

  return possibleGuidance.find(isObject) || {};
}

function readSavedDraft() {
  if (typeof window === "undefined") {
    return null;
  }

  const savedDraft = safelyParseJSON(
    localStorage.getItem(COVER_LETTER_STORAGE_KEY),
  );

  return isObject(savedDraft) ? savedDraft : null;
}

function normaliseText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function normaliseSkill(skill) {
  if (typeof skill === "string") {
    return skill.trim();
  }

  if (isObject(skill)) {
    return normaliseText(
      skill.name ||
        skill.skill ||
        skill.title ||
        skill.label ||
        skill.preferred_label,
    );
  }

  return "";
}

function uniqueSkills(skills) {
  if (!Array.isArray(skills)) {
    return [];
  }

  const result = [];
  const existingSkills = new Set();

  skills.forEach((skill) => {
    const normalisedSkill = normaliseSkill(skill);
    const comparisonKey = normalisedSkill.toLowerCase();

    if (normalisedSkill && !existingSkills.has(comparisonKey)) {
      existingSkills.add(comparisonKey);
      result.push(normalisedSkill);
    }
  });

  return result;
}

function getFirstArray(source, keys) {
  if (!isObject(source)) {
    return [];
  }

  for (const key of keys) {
    if (Array.isArray(source[key])) {
      return source[key];
    }
  }

  return [];
}

const TECHNICAL_TERMS = new Map([
  ["api", "API"],
  ["aws", "AWS"],
  ["css", "CSS"],
  ["git", "Git"],
  ["github", "GitHub"],
  ["html", "HTML"],
  ["javascript", "JavaScript"],
  ["js", "JavaScript"],
  ["json", "JSON"],
  ["linux", "Linux"],
  ["node.js", "Node.js"],
  ["nodejs", "Node.js"],
  ["python", "Python"],
  ["react", "React"],
  ["sql", "SQL"],
  ["typescript", "TypeScript"],
]);

function formatTechnicalTerms(value) {
  const words = normaliseText(value)
    .replaceAll("_", " ")
    .split(/(\s+|[,/()])/);

  return words
    .map((part) => {
      const key = part.trim().toLowerCase();

      if (!key) {
        return part;
      }

      return TECHNICAL_TERMS.get(key) || part;
    })
    .join("");
}

function titleCase(value) {
  const cleaned = normaliseText(value)
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

  return formatTechnicalTerms(cleaned);
}

function polishAdditionalDetails(value) {
  let cleaned = normaliseText(value);

  if (!cleaned) {
    return "";
  }

  cleaned = cleaned
    .replace(/\bstacking website\b/gi, "stack website")
    .replace(/\bfull stack\b/gi, "full-stack")
    .replace(/(^|[.!?]\s+)i\b/g, "$1I")
    .replace(/\s+([,.!?])/g, "$1")
    .replace(/\s{2,}/g, " ");

  cleaned = formatTechnicalTerms(cleaned);

  cleaned = cleaned.replace(
    /\b(HTML|CSS|JavaScript|TypeScript|Python|React|Git|GitHub|SQL|API|AWS|Linux)(?:\s+(HTML|CSS|JavaScript|TypeScript|Python|React|Git|GitHub|SQL|API|AWS|Linux))+(?:\s+and\s+(HTML|CSS|JavaScript|TypeScript|Python|React|Git|GitHub|SQL|API|AWS|Linux))?/g,
    (match) => {
      const technologies = match
        .replace(/\s+and\s+/g, " ")
        .split(/\s+/)
        .filter(Boolean);

      if (technologies.length === 2) {
        return `${technologies[0]} and ${technologies[1]}`;
      }

      return `${technologies.slice(0, -1).join(", ")}, and ${
        technologies[technologies.length - 1]
      }`;
    },
  );

  cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);

  if (!/[.!?]$/.test(cleaned)) {
    cleaned += ".";
  }

  return cleaned;
}

function formatSkillList(skills, maximumSkills = 5) {
  const selectedSkills = skills
    .slice(0, maximumSkills)
    .map((skill) => titleCase(skill));

  if (selectedSkills.length === 0) {
    return "";
  }

  if (selectedSkills.length === 1) {
    return selectedSkills[0];
  }

  if (selectedSkills.length === 2) {
    return `${selectedSkills[0]} and ${selectedSkills[1]}`;
  }

  return `${selectedSkills.slice(0, -1).join(", ")}, and ${
    selectedSkills[selectedSkills.length - 1]
  }`;
}

function getRecommendation(analysis) {
  if (!isObject(analysis)) {
    return {};
  }

  const possibleRecommendations = [
    analysis.career_recommendation,
    analysis.careerRecommendation,
    analysis.recommendation,
    analysis.recommended_career,
    analysis.recommendedCareer,
  ];

  const recommendationObject = possibleRecommendations.find(isObject);

  if (recommendationObject) {
    return recommendationObject;
  }

  const recommendationString = possibleRecommendations.find(
    (value) => typeof value === "string" && value.trim(),
  );

  return recommendationString
    ? {
        title: recommendationString,
      }
    : {};
}

function extractAnalysisData(analysis) {
  if (!isObject(analysis)) {
    return {
      matchedSkills: [],
      missingSkills: [],
      detectedSkills: [],
      requiredSkills: [],
      jobDescription: "",
      recommendedRole: "",
      matchScore: 0,
      coverLetterPoints: [],
      professionalSummary: "",
      aiProvider: "",
    };
  }

  const nestedAnalysis = isObject(analysis.analysis)
    ? analysis.analysis
    : analysis;
  const aiGuidance = getAIGuidance(analysis);
  const recommendation =
    Object.keys(getRecommendation(nestedAnalysis)).length > 0
      ? getRecommendation(nestedAnalysis)
      : getRecommendation(analysis);

  const matchedSkills = uniqueSkills(
    getFirstArray(nestedAnalysis, [
      "matched_skills",
      "matchedSkills",
      "matching_skills",
      "matchingSkills",
    ]).length > 0
      ? getFirstArray(nestedAnalysis, [
          "matched_skills",
          "matchedSkills",
          "matching_skills",
          "matchingSkills",
        ])
      : getFirstArray(analysis, [
          "matched_skills",
          "matchedSkills",
          "matching_skills",
          "matchingSkills",
        ]),
  );

  const missingSkills = uniqueSkills(
    getFirstArray(nestedAnalysis, [
      "missing_skills",
      "missingSkills",
      "skill_gaps",
      "skillGaps",
      "priority_skills",
      "prioritySkills",
    ]).length > 0
      ? getFirstArray(nestedAnalysis, [
          "missing_skills",
          "missingSkills",
          "skill_gaps",
          "skillGaps",
          "priority_skills",
          "prioritySkills",
        ])
      : getFirstArray(analysis, [
          "missing_skills",
          "missingSkills",
          "skill_gaps",
          "skillGaps",
          "priority_skills",
          "prioritySkills",
        ]),
  );

  const detectedSkills = uniqueSkills(
    getFirstArray(nestedAnalysis, [
      "cv_skills",
      "cvSkills",
      "detected_skills",
      "detectedSkills",
      "skills",
    ]).length > 0
      ? getFirstArray(nestedAnalysis, [
          "cv_skills",
          "cvSkills",
          "detected_skills",
          "detectedSkills",
          "skills",
        ])
      : getFirstArray(analysis, [
          "cv_skills",
          "cvSkills",
          "detected_skills",
          "detectedSkills",
          "skills",
        ]),
  );

  const requiredSkills = uniqueSkills(
    getFirstArray(nestedAnalysis, [
      "required_skills",
      "requiredSkills",
      "job_skills",
      "jobSkills",
    ]).length > 0
      ? getFirstArray(nestedAnalysis, [
          "required_skills",
          "requiredSkills",
          "job_skills",
          "jobSkills",
        ])
      : getFirstArray(analysis, [
          "required_skills",
          "requiredSkills",
          "job_skills",
          "jobSkills",
        ]),
  );

  const rawScore =
    nestedAnalysis.match_score ??
    nestedAnalysis.matchScore ??
    nestedAnalysis.score ??
    analysis.match_score ??
    analysis.matchScore ??
    analysis.score ??
    recommendation.match_score ??
    recommendation.matchScore ??
    recommendation.score ??
    0;

  const numericScore = Number(rawScore);
  const matchScore = Number.isFinite(numericScore)
    ? numericScore <= 1 && numericScore > 0
      ? numericScore * 100
      : numericScore
    : 0;

  const jobDescription = normaliseText(
    nestedAnalysis.job_description ||
      nestedAnalysis.jobDescription ||
      nestedAnalysis.submitted_job_description ||
      nestedAnalysis.submittedJobDescription ||
      analysis.job_description ||
      analysis.jobDescription ||
      analysis.submitted_job_description ||
      analysis.submittedJobDescription,
  );

  const recommendedRole = normaliseText(
    recommendation.title ||
      recommendation.role ||
      recommendation.career ||
      recommendation.name ||
      nestedAnalysis.recommended_role ||
      nestedAnalysis.recommendedRole ||
      analysis.recommended_role ||
      analysis.recommendedRole,
  );

  const coverLetterPoints = uniqueSkills(
    Array.isArray(aiGuidance.cover_letter_points)
      ? aiGuidance.cover_letter_points
      : Array.isArray(aiGuidance.coverLetterPoints)
        ? aiGuidance.coverLetterPoints
        : [],
  );

  const professionalSummary = normaliseText(
    aiGuidance.professional_summary ||
      aiGuidance.professionalSummary,
  );

  const aiProvider = normaliseText(
    aiGuidance.provider ||
      aiGuidance.ai_provider ||
      aiGuidance.aiProvider,
  );

  return {
    matchedSkills,
    missingSkills,
    detectedSkills,
    requiredSkills,
    jobDescription,
    recommendedRole,
    matchScore: Math.max(0, Math.min(100, matchScore)),
    coverLetterPoints,
    professionalSummary,
    aiProvider,
  };
}

function inferJobTitle(jobDescription, recommendedRole) {
  const description = normaliseText(jobDescription);

  const patterns = [
    /(?:seeking|hiring|looking for|position of|role of)\s+(?:an?\s+)?([^.,\n]+)/i,
    /job title\s*:\s*([^\n]+)/i,
    /position\s*:\s*([^\n]+)/i,
    /role\s*:\s*([^\n]+)/i,
  ];

  for (const pattern of patterns) {
    const match = description.match(pattern);

    if (match?.[1]) {
      const inferredTitle = match[1]
        .slice(0, 80)
        .split(/\s+(?:to|who|that|responsible for)\s+/i)[0]
        .trim();

      return titleCase(inferredTitle);
    }
  }

  return titleCase(recommendedRole);
}

function createInitialState() {
  const storedAnalysis = readLatestAnalysis();
  const analysisData = extractAnalysisData(storedAnalysis);
  const savedDraft = readSavedDraft();

  const initialForm = {
    ...EMPTY_FORM,
    jobTitle: inferJobTitle(
      analysisData.jobDescription,
      analysisData.recommendedRole,
    ),
    ...(isObject(savedDraft?.form) ? savedDraft.form : {}),
  };

  return {
    analysis: storedAnalysis,
    form: initialForm,
    coverLetter:
      typeof savedDraft?.coverLetter === "string"
        ? savedDraft.coverLetter
        : "",
  };
}

function buildOpeningParagraph({
  tone,
  jobTitle,
  companyName,
  strongestSkills,
}) {
  const role = jobTitle || "the advertised position";
  const organisation = companyName || "your organisation";
  const skillsText = formatSkillList(strongestSkills, 3);

  if (tone === "confident") {
    return `I am pleased to apply for ${role} at ${organisation}. My experience and demonstrated strengths${
      skillsText ? ` in ${skillsText}` : ""
    } would allow me to make a positive contribution to your team from the outset.`;
  }

  if (tone === "concise") {
    return `I am applying for ${role} at ${organisation}. My background${
      skillsText ? ` in ${skillsText}` : ""
    } aligns with several of the position's key requirements.`;
  }

  return `I am writing to express my interest in ${role} at ${organisation}. My background${
    skillsText ? ` includes strengths in ${skillsText}` : ""
  }, and I am keen to apply these capabilities in a role where I can contribute while continuing to develop professionally.`;
}

function buildEvidenceParagraph({
  matchedSkills,
  detectedSkills,
  matchScore,
  tone,
}) {
  const evidenceSkills =
    matchedSkills.length > 0 ? matchedSkills : detectedSkills;
  const skillsText = formatSkillList(evidenceSkills, 5);

  if (!skillsText) {
    return "I bring transferable experience, a willingness to learn and a careful, reliable approach to responsibilities. I would welcome the opportunity to explain how my background could support your team.";
  }

  if (tone === "confident") {
    return `My relevant capabilities include ${skillsText}. These strengths support my ability to communicate effectively, approach problems methodically and adapt my existing knowledge to the responsibilities of the role.${
      matchScore > 0
        ? ` I am confident that this combination would allow me to contribute positively while continuing to develop in the position.`
        : ""
    }`;
  }

  if (tone === "concise") {
    return `My relevant capabilities include ${skillsText}. I would apply these strengths to the role's day-to-day responsibilities and the wider objectives of the team.`;
  }

  return `My relevant strengths include ${skillsText}. I have developed these capabilities through my experience and would apply them to completing tasks accurately, collaborating with colleagues and supporting the organisation's objectives.${
    matchScore > 0
      ? ` I would also bring a realistic understanding of my current strengths and a commitment to continued professional development.`
      : ""
  }`;
}

function buildDevelopmentParagraph({ missingSkills, jobTitle }) {
  if (missingSkills.length === 0) {
    return "I am committed to continuous learning and would approach the position with curiosity, professionalism and a willingness to develop further in response to the team's priorities.";
  }

  const skillsText = formatSkillList(missingSkills, 4);

  return `I also recognise the importance of continuing to strengthen my knowledge of ${skillsText}. I have already identified these as priority development areas and would approach them through focused study and practical application. This self-awareness, combined with my willingness to learn, would help me grow effectively in ${
    jobTitle || "the position"
  }.`;
}

function buildGeminiEvidenceParagraph(coverLetterPoints) {
  if (
    !Array.isArray(coverLetterPoints) ||
    coverLetterPoints.length === 0
  ) {
    return "";
  }

  const selectedPoints = coverLetterPoints
    .slice(0, 4)
    .map((point) => normaliseText(point))
    .filter(Boolean);

  if (selectedPoints.length === 0) {
    return "";
  }

  return [
    "I would particularly highlight the following relevant strengths and experience:",
    ...selectedPoints.map((point) => `• ${point}`),
  ].join("\n");
}

function generateCoverLetter(form, analysisData) {
  const applicantName = normaliseText(form.applicantName) || "Your Name";
  const applicantEmail = normaliseText(form.applicantEmail);
  const applicantPhone = normaliseText(form.applicantPhone);
  const hiringManager =
    normaliseText(form.hiringManager) || "Hiring Manager";
  const companyName = normaliseText(form.companyName);
  const jobTitle =
    normaliseText(form.jobTitle) ||
    analysisData.recommendedRole ||
    "the advertised position";
  const location = normaliseText(form.location);
  const additionalDetails = polishAdditionalDetails(
    form.additionalDetails,
  );

  const strongestSkills =
    analysisData.matchedSkills.length > 0
      ? analysisData.matchedSkills
      : analysisData.detectedSkills;

  const contactLines = [
    applicantName,
    applicantEmail,
    applicantPhone,
    location,
  ].filter(Boolean);

  const organisationLine = companyName
    ? `${hiringManager}\n${companyName}`
    : hiringManager;

  const paragraphs = [
    buildOpeningParagraph({
      tone: form.tone,
      jobTitle,
      companyName,
      strongestSkills,
    }),
    buildEvidenceParagraph({
      matchedSkills: analysisData.matchedSkills,
      detectedSkills: analysisData.detectedSkills,
      matchScore: analysisData.matchScore,
      tone: form.tone,
    }),
    buildDevelopmentParagraph({
      missingSkills: analysisData.missingSkills,
      jobTitle,
    }),
  ];

  const geminiEvidenceParagraph = buildGeminiEvidenceParagraph(
    analysisData.coverLetterPoints,
  );

  if (geminiEvidenceParagraph) {
    paragraphs.splice(2, 0, geminiEvidenceParagraph);
  }

  if (additionalDetails) {
    paragraphs.push(additionalDetails);
  }

  paragraphs.push(
    `I would welcome the opportunity to discuss my application and explain how my experience, motivation and development goals align with ${
      companyName ? `${companyName}'s` : "your"
    } requirements. Thank you for considering my application.`,
  );

  return `${contactLines.join("\n")}

${new Date().toLocaleDateString("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
})}

${organisationLine}

Dear ${hiringManager},

${paragraphs.join("\n\n")}

Yours sincerely,

${applicantName}`;
}

function CoverLetter() {
  const [initialState] = useState(createInitialState);
  const [analysis] = useState(initialState.analysis);
  const [form, setForm] = useState(initialState.form);
  const [coverLetter, setCoverLetter] = useState(initialState.coverLetter);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const analysisData = useMemo(
    () => extractAnalysisData(analysis),
    [analysis],
  );

  const hasAnalysis = Boolean(analysis);

  const supportingSkills = useMemo(() => {
    const combinedSkills = [
      ...analysisData.matchedSkills,
      ...analysisData.detectedSkills,
    ];

    return uniqueSkills(combinedSkills).slice(0, 8);
  }, [analysisData]);

  function handleInputChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));

    setStatusMessage("");
    setErrorMessage("");
  }

  function saveDraft(nextCoverLetter) {
    if (typeof window === "undefined") {
      return;
    }

    localStorage.setItem(
      COVER_LETTER_STORAGE_KEY,
      JSON.stringify({
        form,
        coverLetter: nextCoverLetter,
        updatedAt: new Date().toISOString(),
      }),
    );
  }

  function handleGenerate(event) {
    event.preventDefault();
    setErrorMessage("");
    setStatusMessage("");

    if (!normaliseText(form.applicantName)) {
      setErrorMessage("Enter your name before generating the cover letter.");
      return;
    }

    if (!normaliseText(form.jobTitle)) {
      setErrorMessage("Enter the job title you are applying for.");
      return;
    }

    if (!normaliseText(form.companyName)) {
      setErrorMessage("Enter the employer or company name.");
      return;
    }

    const generatedLetter = generateCoverLetter(form, analysisData);

    setCoverLetter(generatedLetter);

    try {
      saveDraft(generatedLetter);
      setStatusMessage(
        analysisData.coverLetterPoints.length > 0
          ? "Your draft was generated using the latest Gemini guidance and saved."
          : "Your draft was generated using the local fallback and saved.",
      );
    } catch {
      setStatusMessage(
        "Your cover letter was generated, but the browser could not save it.",
      );
    }
  }

  function handleLetterChange(event) {
    const updatedLetter = event.target.value;
    setCoverLetter(updatedLetter);
    setStatusMessage("");
  }

  function handleSave() {
    if (!normaliseText(coverLetter)) {
      setErrorMessage("Generate or enter a cover letter before saving.");
      return;
    }

    setErrorMessage("");

    try {
      saveDraft(coverLetter);
      setStatusMessage("Your edited cover letter has been saved.");
    } catch {
      setErrorMessage("The browser could not save your cover-letter draft.");
    }
  }

  async function handleCopy() {
    if (!normaliseText(coverLetter)) {
      setErrorMessage("Generate a cover letter before copying it.");
      return;
    }

    setErrorMessage("");

    try {
      await navigator.clipboard.writeText(coverLetter);
      setStatusMessage("Cover letter copied to your clipboard.");
    } catch {
      setErrorMessage(
        "The browser could not copy the letter. Select the text and copy it manually.",
      );
    }
  }

  function handleDownload() {
    if (!normaliseText(coverLetter)) {
      setErrorMessage("Generate a cover letter before downloading it.");
      return;
    }

    setErrorMessage("");

    const companyName =
      normaliseText(form.companyName)
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-|-$/g, "") || "employer";

    const fileContent = new Blob([coverLetter], {
      type: "text/plain;charset=utf-8",
    });

    const downloadUrl = URL.createObjectURL(fileContent);
    const downloadLink = document.createElement("a");

    downloadLink.href = downloadUrl;
    downloadLink.download = `cover-letter-${companyName}.txt`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    URL.revokeObjectURL(downloadUrl);

    setStatusMessage("Your cover letter has been downloaded.");
  }

  function handleReset() {
    const confirmed = window.confirm(
      "Clear the cover-letter form and saved draft?",
    );

    if (!confirmed) {
      return;
    }

    const resetForm = {
      ...EMPTY_FORM,
      jobTitle: inferJobTitle(
        analysisData.jobDescription,
        analysisData.recommendedRole,
      ),
    };

    setForm(resetForm);
    setCoverLetter("");
    setStatusMessage("");
    setErrorMessage("");

    try {
      localStorage.removeItem(COVER_LETTER_STORAGE_KEY);
    } catch {
      // The local state has still been reset.
    }
  }

  return (
    <main className="cover-page">
      <section className="cover-shell">
        <header className="cover-topbar">
          <Link className="cover-back-link" to="/dashboard">
            <span aria-hidden="true">←</span>
            Back to dashboard
          </Link>

          <span className="cover-brand-label">
            CareerPilot AI · Application tools
          </span>
        </header>

        <section className="cover-hero">
          <div className="cover-hero-copy">
            <span className="cover-eyebrow">Cover letter builder</span>

            <h1>Create a focused application letter.</h1>
          </div>

          <p className="cover-hero-description">
            Use information from your latest CV analysis to prepare a
            professional first draft. Review and personalise every section
            before submitting it to an employer.
          </p>
        </section>

        {!hasAnalysis && (
          <section className="cover-notice cover-notice-warning">
            <div>
              <strong>No saved CV analysis was found</strong>
              <p>
                You can still create a letter manually, but analysing your CV
                first will provide more relevant skills and development areas.
              </p>
            </div>

            <Link className="cover-inline-link" to="/upload-cv">
              Analyse a CV
            </Link>
          </section>
        )}

        {hasAnalysis && (
          <section className="cover-analysis-summary">
            <div className="cover-summary-heading">
              <div>
                <span className="cover-eyebrow">Latest analysis</span>
                <h2>Application evidence</h2>
              </div>

              <Link className="cover-inline-link" to="/job-comparison">
                View full comparison
              </Link>
            </div>

            <div className="cover-summary-grid">
              <article className="cover-summary-card">
                <span>Target pathway</span>
                <strong>
                  {analysisData.recommendedRole || "Not identified"}
                </strong>
              </article>

              <article className="cover-summary-card">
                <span>Matched skills</span>
                <strong>{analysisData.matchedSkills.length}</strong>
              </article>

              <article className="cover-summary-card">
                <span>Development areas</span>
                <strong>{analysisData.missingSkills.length}</strong>
              </article>

              <article className="cover-summary-card">
                <span>Career compatibility</span>
                <strong>{analysisData.matchScore.toFixed(1)}%</strong>
              </article>
            </div>

            {supportingSkills.length > 0 && (
              <div className="cover-skill-section">
                <span>Skills available for your letter</span>

                <div className="cover-skill-list">
                  {supportingSkills.map((skill) => (
                    <span className="cover-skill-tag" key={skill}>
                      {titleCase(skill)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysisData.coverLetterPoints.length > 0 && (
              <div className="cover-skill-section">
                <span>Gemini suggestions for this application</span>

                <ul className="cover-ai-points">
                  {analysisData.coverLetterPoints.map((point, index) => (
                    <li key={`${point}-${index}`}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        <section className="cover-workspace">
          <form className="cover-form-panel" onSubmit={handleGenerate}>
            <div className="cover-panel-heading">
              <span className="cover-step-number">1</span>

              <div>
                <span className="cover-eyebrow">Application details</span>
                <h2>Tell us about the application</h2>
                <p>
                  Complete the fields below before generating your draft.
                </p>
              </div>
            </div>

            <div className="cover-form-grid">
              <label className="cover-field">
                <span>Your full name</span>
                <input
                  autoComplete="name"
                  name="applicantName"
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  type="text"
                  value={form.applicantName}
                />
              </label>

              <label className="cover-field">
                <span>Email address</span>
                <input
                  autoComplete="email"
                  name="applicantEmail"
                  onChange={handleInputChange}
                  placeholder="name@example.com"
                  type="email"
                  value={form.applicantEmail}
                />
              </label>

              <label className="cover-field">
                <span>Phone number</span>
                <input
                  autoComplete="tel"
                  name="applicantPhone"
                  onChange={handleInputChange}
                  placeholder="Your contact number"
                  type="tel"
                  value={form.applicantPhone}
                />
              </label>

              <label className="cover-field">
                <span>Your location</span>
                <input
                  autoComplete="address-level2"
                  name="location"
                  onChange={handleInputChange}
                  placeholder="City, country"
                  type="text"
                  value={form.location}
                />
              </label>

              <label className="cover-field">
                <span>Job title </span>
                <input
                  name="jobTitle"
                  onChange={handleInputChange}
                  placeholder="For example, Junior Data Analyst"
                  type="text"
                  value={form.jobTitle}
                />
              </label>

              <label className="cover-field">
                <span>Company name</span>
                <input
                  autoComplete="organization"
                  name="companyName"
                  onChange={handleInputChange}
                  placeholder="Employer or organisation"
                  type="text"
                  value={form.companyName}
                />
              </label>

              <label className="cover-field">
                <span>Hiring manager</span>
                <input
                  name="hiringManager"
                  onChange={handleInputChange}
                  placeholder="Hiring Manager"
                  type="text"
                  value={form.hiringManager}
                />
              </label>

              <label className="cover-field">
                <span>Writing style</span>
                <select
                  name="tone"
                  onChange={handleInputChange}
                  value={form.tone}
                >
                  {TONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="cover-field cover-field-full">
                <span>Additional evidence or achievements</span>
                <textarea
                  maxLength={2000}
                  name="additionalDetails"
                  onChange={handleInputChange}
                  placeholder="Add a relevant achievement, project, qualification or reason for applying."
                  rows={5}
                  value={form.additionalDetails}
                />

                <small>
                  {form.additionalDetails.length.toLocaleString()} / 2,000
                  characters
                </small>
              </label>
            </div>

            {errorMessage && (
              <div className="cover-feedback cover-feedback-error" role="alert">
                {errorMessage}
              </div>
            )}

            {statusMessage && (
              <div
                className="cover-feedback cover-feedback-success"
                role="status"
              >
                {statusMessage}
              </div>
            )}

            <button className="cover-primary-button" type="submit">
              Generate cover-letter draft
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <section className="cover-editor-panel">
            <div className="cover-panel-heading">
              <span className="cover-step-number">2</span>

              <div>
                <span className="cover-eyebrow">Editable draft</span>
                <h2>Review and personalise</h2>
                <p>
                  Check all claims, add concrete evidence and adapt the wording
                  to the vacancy.
                </p>
              </div>
            </div>

            {coverLetter ? (
              <>
                <label className="cover-letter-editor">
                  <span className="sr-only">Generated cover letter</span>
                  <textarea
                    aria-label="Generated cover letter"
                    onChange={handleLetterChange}
                    spellCheck="true"
                    value={coverLetter}
                  />
                </label>

                <div className="cover-editor-meta">
                  <span>
                    {coverLetter.trim().split(/\s+/).length.toLocaleString()}{" "}
                    words
                  </span>
                  <span>{coverLetter.length.toLocaleString()} characters</span>
                </div>

                <div className="cover-editor-actions">
                  <button
                    className="cover-secondary-button"
                    onClick={handleSave}
                    type="button"
                  >
                    Save draft
                  </button>

                  <button
                    className="cover-secondary-button"
                    onClick={handleCopy}
                    type="button"
                  >
                    Copy text
                  </button>

                  <button
                    className="cover-secondary-button"
                    onClick={handleDownload}
                    type="button"
                  >
                    Download .txt
                  </button>

                  <button
                    className="cover-danger-button"
                    onClick={handleReset}
                    type="button"
                  >
                    Clear draft
                  </button>
                </div>
              </>
            ) : (
              <div className="cover-empty-state">
                <span className="cover-empty-icon" aria-hidden="true">
                  ✦
                </span>

                <h3>Your generated draft will appear here</h3>

                <p>
                  Complete the application details and select “Generate
                  cover-letter draft”.
                </p>
              </div>
            )}
          </section>
        </section>

        <section className="cover-guidance">
          <span className="cover-eyebrow">Before submitting</span>

          <h2>Make the letter genuinely yours</h2>

          <div className="cover-guidance-grid">
            <article>
              <span>01</span>
              <h3>Add evidence</h3>
              <p>
                Replace broad statements with a real example, measurable result
                or relevant project.
              </p>
            </article>

            <article>
              <span>02</span>
              <h3>Check accuracy</h3>
              <p>
                Confirm that every skill and achievement is supported by your
                CV and experience.
              </p>
            </article>

            <article>
              <span>03</span>
              <h3>Adapt the language</h3>
              <p>
                Use important terminology from the vacancy naturally without
                copying the advertisement.
              </p>
            </article>
          </div>
        </section>

        <footer className="cover-footer-actions">
          <Link className="cover-secondary-button" to="/interview-practice">
            Interview practice
          </Link>

          <Link className="cover-secondary-button" to="/job-comparison">
            View job comparison
          </Link>

          <Link className="cover-primary-link" to="/dashboard">
            Return to dashboard
            <span aria-hidden="true">→</span>
          </Link>
        </footer>
      </section>

      <style>{`
        .cover-page {
          min-height: 100vh;
          padding: 3rem 1.5rem;
          color: #10172f;
          background:
            radial-gradient(circle at 50% 0%, rgba(105, 156, 255, 0.2), transparent 35rem),
            linear-gradient(135deg, #f7f5ff 0%, #eef7ff 52%, #f8f5ff 100%);
        }

        .cover-shell {
          width: min(1380px, 100%);
          margin: 0 auto;
        }

        .cover-topbar,
        .cover-summary-heading,
        .cover-footer-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .cover-topbar {
          margin-bottom: 4.5rem;
        }

        .cover-back-link,
        .cover-inline-link {
          color: #11182e;
          font-weight: 750;
          text-decoration: none;
        }

        .cover-back-link {
          display: inline-flex;
          align-items: center;
          gap: 0.7rem;
          font-size: 1.05rem;
        }

        .cover-back-link:hover,
        .cover-inline-link:hover {
          color: #2563eb;
        }

        .cover-brand-label,
        .cover-eyebrow,
        .cover-summary-card > span {
          color: #2471ea;
          font-size: 0.78rem;
          font-weight: 850;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        .cover-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(300px, 0.9fr);
          align-items: end;
          gap: 4rem;
          margin-bottom: 3rem;
        }

        .cover-hero h1 {
          max-width: 780px;
          margin: 1rem 0 0;
          font-size: clamp(3.4rem, 7vw, 7rem);
          line-height: 0.91;
          letter-spacing: -0.075em;
        }

        .cover-hero-description {
          max-width: 580px;
          margin: 0 0 0.5rem;
          color: #68728a;
          font-size: clamp(1.05rem, 2vw, 1.35rem);
          line-height: 1.8;
        }

        .cover-notice,
        .cover-analysis-summary,
        .cover-form-panel,
        .cover-editor-panel,
        .cover-guidance {
          border: 1px solid rgba(16, 24, 47, 0.12);
          border-radius: 28px;
          background: rgba(255, 255, 255, 0.93);
          box-shadow: 0 20px 60px rgba(52, 74, 127, 0.08);
        }

        .cover-notice {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.5rem 1.75rem;
          margin-bottom: 1.5rem;
        }

        .cover-notice p {
          margin: 0.35rem 0 0;
          color: #677188;
        }

        .cover-notice-warning {
          border-color: rgba(210, 140, 25, 0.3);
          background: #fffaf0;
        }

        .cover-analysis-summary {
          padding: 2rem;
          margin-bottom: 1.5rem;
        }

        .cover-summary-heading h2,
        .cover-panel-heading h2,
        .cover-guidance h2 {
          margin: 0.4rem 0;
          font-size: clamp(1.7rem, 3vw, 2.3rem);
          letter-spacing: -0.04em;
        }

        .cover-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 1rem;
          margin-top: 1.75rem;
        }

        .cover-summary-card {
          min-height: 130px;
          padding: 1.4rem;
          border: 1px solid rgba(16, 24, 47, 0.12);
          border-radius: 20px;
          background: #ffffff;
        }

        .cover-summary-card strong {
          display: block;
          margin-top: 1rem;
          font-size: clamp(1.5rem, 3vw, 2.2rem);
        }

        .cover-skill-section {
          margin-top: 1.5rem;
        }

        .cover-skill-section > span {
          color: #68728a;
          font-weight: 700;
        }

        .cover-skill-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.7rem;
          margin-top: 0.8rem;
        }

        .cover-skill-tag {
          padding: 0.65rem 0.9rem;
          border-radius: 999px;
          color: #14532d;
          background: #e4f8ea;
          font-weight: 750;
        }

        .cover-ai-points {
          display: grid;
          gap: 0.75rem;
          padding-left: 1.25rem;
          margin: 1rem 0 0;
          color: #4f5b73;
          line-height: 1.65;
        }

        .cover-ai-points li::marker {
          color: #286bea;
        }

        .cover-workspace {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 1.5rem;
          align-items: start;
        }

        .cover-form-panel,
        .cover-editor-panel {
          padding: clamp(1.4rem, 3vw, 2.4rem);
        }

        .cover-editor-panel {
          position: sticky;
          top: 1.5rem;
        }

        .cover-panel-heading {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .cover-panel-heading p {
          margin: 0.4rem 0 0;
          color: #68728a;
          line-height: 1.6;
        }

        .cover-step-number {
          display: grid;
          flex: 0 0 48px;
          width: 48px;
          height: 48px;
          place-items: center;
          border-radius: 16px;
          color: white;
          background: #286bea;
          font-weight: 850;
          box-shadow: 0 10px 25px rgba(40, 107, 234, 0.25);
        }

        .cover-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 1.2rem;
        }

        .cover-field {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
        }

        .cover-field > span {
          font-weight: 760;
        }

        .cover-field input,
        .cover-field select,
        .cover-field textarea,
        .cover-letter-editor textarea {
          width: 100%;
          border: 1px solid #cfd5df;
          border-radius: 15px;
          color: #12182d;
          background: #ffffff;
          font: inherit;
          outline: none;
          transition:
            border-color 160ms ease,
            box-shadow 160ms ease;
        }

        .cover-field input,
        .cover-field select {
          min-height: 54px;
          padding: 0 1rem;
        }

        .cover-field textarea {
          min-height: 135px;
          padding: 1rem;
          resize: vertical;
          line-height: 1.6;
        }

        .cover-field input:focus,
        .cover-field select:focus,
        .cover-field textarea:focus,
        .cover-letter-editor textarea:focus {
          border-color: #286bea;
          box-shadow: 0 0 0 4px rgba(40, 107, 234, 0.12);
        }

        .cover-field-full {
          grid-column: 1 / -1;
        }

        .cover-field small {
          align-self: flex-end;
          color: #7a8499;
        }

        .cover-primary-button,
        .cover-primary-link,
        .cover-secondary-button,
        .cover-danger-button {
          display: inline-flex;
          min-height: 54px;
          align-items: center;
          justify-content: center;
          gap: 0.7rem;
          border-radius: 15px;
          padding: 0.9rem 1.25rem;
          font: inherit;
          font-weight: 800;
          text-decoration: none;
          cursor: pointer;
          transition:
            transform 160ms ease,
            box-shadow 160ms ease,
            background 160ms ease;
        }

        .cover-primary-button,
        .cover-primary-link {
          border: 1px solid #286bea;
          color: #ffffff;
          background: #286bea;
          box-shadow: 0 12px 25px rgba(40, 107, 234, 0.2);
        }

        .cover-primary-button {
          width: 100%;
          margin-top: 1.4rem;
        }

        .cover-secondary-button {
          border: 1px solid #ced4df;
          color: #12182d;
          background: #ffffff;
        }

        .cover-danger-button {
          border: 1px solid #efcaca;
          color: #a52121;
          background: #fff8f8;
        }

        .cover-primary-button:hover,
        .cover-primary-link:hover,
        .cover-secondary-button:hover,
        .cover-danger-button:hover {
          transform: translateY(-2px);
        }

        .cover-feedback {
          padding: 0.9rem 1rem;
          margin-top: 1rem;
          border-radius: 12px;
          font-weight: 700;
        }

        .cover-feedback-error {
          color: #9f2020;
          background: #fff0f0;
        }

        .cover-feedback-success {
          color: #166534;
          background: #ebf9ef;
        }

        .cover-empty-state {
          display: grid;
          min-height: 485px;
          place-items: center;
          align-content: center;
          padding: 2rem;
          border: 1px dashed #b8c5dc;
          border-radius: 20px;
          text-align: center;
          background: #f8faff;
        }

        .cover-empty-state h3 {
          margin: 1rem 0 0.5rem;
          font-size: 1.4rem;
        }

        .cover-empty-state p {
          max-width: 390px;
          margin: 0;
          color: #68728a;
          line-height: 1.65;
        }

        .cover-empty-icon {
          display: grid;
          width: 60px;
          height: 60px;
          place-items: center;
          border-radius: 20px;
          color: #286bea;
          background: #e9f0ff;
          font-size: 1.6rem;
        }

        .cover-letter-editor textarea {
          min-height: 590px;
          padding: 1.3rem;
          resize: vertical;
          line-height: 1.75;
        }

        .cover-editor-meta {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
          margin-top: 0.65rem;
          color: #7b8497;
          font-size: 0.9rem;
        }

        .cover-editor-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.8rem;
          margin-top: 1.2rem;
        }

        .cover-guidance {
          padding: clamp(1.5rem, 4vw, 3rem);
          margin-top: 1.5rem;
        }

        .cover-guidance-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1rem;
          margin-top: 1.5rem;
        }

        .cover-guidance article {
          padding: 1.4rem;
          border: 1px solid rgba(16, 24, 47, 0.1);
          border-radius: 18px;
          background: #fbfcff;
        }

        .cover-guidance article > span {
          color: #286bea;
          font-weight: 850;
        }

        .cover-guidance h3 {
          margin: 0.9rem 0 0.5rem;
        }

        .cover-guidance p {
          margin: 0;
          color: #68728a;
          line-height: 1.65;
        }

        .cover-footer-actions {
          margin-top: 1.5rem;
          padding: 1.5rem 0;
        }

        .cover-footer-actions > * {
          flex: 1;
        }

        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        @media (max-width: 1000px) {
          .cover-hero,
          .cover-workspace {
            grid-template-columns: 1fr;
          }

          .cover-hero {
            gap: 2rem;
          }

          .cover-editor-panel {
            position: static;
          }

          .cover-summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 700px) {
          .cover-page {
            padding: 1.5rem 0.8rem;
          }

          .cover-topbar,
          .cover-summary-heading,
          .cover-footer-actions,
          .cover-notice {
            align-items: flex-start;
            flex-direction: column;
          }

          .cover-topbar {
            margin-bottom: 3rem;
          }

          .cover-brand-label {
            display: none;
          }

          .cover-hero h1 {
            font-size: clamp(3rem, 16vw, 4.5rem);
          }

          .cover-summary-grid,
          .cover-form-grid,
          .cover-guidance-grid,
          .cover-editor-actions {
            grid-template-columns: 1fr;
          }

          .cover-field-full {
            grid-column: auto;
          }

          .cover-footer-actions > * {
            width: 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .cover-primary-button,
          .cover-primary-link,
          .cover-secondary-button,
          .cover-danger-button,
          .cover-field input,
          .cover-field select,
          .cover-field textarea,
          .cover-letter-editor textarea {
            transition: none;
          }
        }
      `}</style>
    </main>
  );
}

export default CoverLetter;