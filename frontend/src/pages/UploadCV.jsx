import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowLeft,
  FiBriefcase,
  FiCheckCircle,
  FiFileText,
  FiRefreshCw,
  FiTarget,
  FiUploadCloud,
  FiX,
  FiXCircle,
} from "react-icons/fi";

// Backend API URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

// Validation limits
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_JOB_DESCRIPTION_LENGTH = 50000;
const MIN_JOB_DESCRIPTION_LENGTH = 10;

function UploadCV() {
  const fileInputRef = useRef(null);
  
  // Component state
  const [selectedFile, setSelectedFile] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [error, setError] = useState("");
  const [analysisResult, setAnalysisResult] = useState(null);

  function validateFile(file) {
    if (!file) {
      return "Please select a PDF CV.";
    }

    const fileName = file.name.toLowerCase();
    const isPdf =
      file.type === "application/pdf" || fileName.endsWith(".pdf");

    if (!isPdf) {
      return "Only PDF files are accepted.";
    }

    if (file.size === 0) {
      return "The selected PDF file is empty.";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "The selected PDF must not be larger than 5 MB.";
    }

    return "";
  }

  function validateJobDescription(value) {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return "Please enter a job description.";
    }

    if (trimmedValue.length < MIN_JOB_DESCRIPTION_LENGTH) {
      return `The job description must contain at least ${MIN_JOB_DESCRIPTION_LENGTH} characters.`;
    }

    if (trimmedValue.length > MAX_JOB_DESCRIPTION_LENGTH) {
      return `The job description must not exceed ${MAX_JOB_DESCRIPTION_LENGTH.toLocaleString()} characters.`;
    }

    return "";
  }

  function formatFileSize(sizeInBytes) {
    if (sizeInBytes < 1024) {
      return `${sizeInBytes} bytes`;
    }

    if (sizeInBytes < 1024 * 1024) {
      return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    }

    return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
  }

  function clearMessages() {
    setError("");
    setAnalysisResult(null);
  }

  function applySelectedFile(file) {
    clearMessages();

    const validationError = validateFile(file);

    if (validationError) {
      setSelectedFile(null);
      setError(validationError);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      return;
    }

    setSelectedFile(file);
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0] ?? null;
    applySelectedFile(file);
  }

  function openFilePicker() {
    if (!isAnalysing) {
      fileInputRef.current?.click();
    }
  }

  function removeSelectedFile() {
    if (isAnalysing) {
      return;
    }

    setSelectedFile(null);
    clearMessages();

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleDragEnter(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!isAnalysing) {
      setIsDragging(true);
    }
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = "copy";
    }
  }

  function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();

    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsDragging(false);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    setIsDragging(false);

    if (isAnalysing) {
      return;
    }

    const file = event.dataTransfer.files?.[0] ?? null;
    applySelectedFile(file);
  }

  function handleJobDescriptionChange(event) {
    const value = event.target.value;

    if (value.length <= MAX_JOB_DESCRIPTION_LENGTH) {
      setJobDescription(value);
      setError("");
      setAnalysisResult(null);
    }
  }

  async function readResponse(response) {
    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      return response.json();
    }

    const responseText = await response.text();

    return {
      detail: responseText || "The backend returned an empty response.",
    };
  }

  function extractErrorMessage(responseData) {
    if (typeof responseData?.detail === "string") {
      return responseData.detail;
    }

    if (Array.isArray(responseData?.detail)) {
      const validationMessages = responseData.detail
        .map((item) => {
          const location = Array.isArray(item?.loc)
            ? item.loc.filter((part) => part !== "body").join(" → ")
            : "";

          if (location && item?.msg) {
            return `${location}: ${item.msg}`;
          }

          return item?.msg;
        })
        .filter(Boolean);

      if (validationMessages.length > 0) {
        return validationMessages.join(" ");
      }
    }

    if (typeof responseData?.message === "string") {
      return responseData.message;
    }

    if (typeof responseData?.error === "string") {
      return responseData.error;
    }

    return "The CV analysis request could not be completed.";
  }

  function normaliseStringList(value) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (typeof item?.name === "string") {
          return item.name;
        }

        if (typeof item?.skill === "string") {
          return item.skill;
        }

        if (typeof item?.title === "string") {
          return item.title;
        }

        return "";
      })
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function getAnalysisData(responseData) {
    return responseData?.analysis ?? responseData?.result ?? responseData ?? {};
  }

  function getMatchScore(analysis) {
    const possibleScore =
      analysis?.match_score ??
      analysis?.score ??
      analysis?.match_percentage ??
      analysis?.percentage;

    const numericScore = Number(possibleScore);

    if (!Number.isFinite(numericScore)) {
      return 0;
    }

    if (numericScore > 0 && numericScore <= 1) {
      return numericScore * 100;
    }

    return Math.min(100, Math.max(0, numericScore));
  }

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

  async function handleSubmit(event) {
    event.preventDefault();

    if (isAnalysing) {
      return;
    }

    clearMessages();

    const fileValidationError = validateFile(selectedFile);

    if (fileValidationError) {
      setError(fileValidationError);
      return;
    }

    const jobValidationError = validateJobDescription(jobDescription);

    if (jobValidationError) {
      setError(jobValidationError);
      return;
    }

    const formData = new FormData();

    // form data 
    formData.append("file", selectedFile);
    formData.append("job_description", jobDescription.trim());

    try {
      setIsAnalysing(true);

      const response = await fetch(
        `${API_BASE_URL}/upload-and-analyse-cv`,
        {
          method: "POST",
          body: formData,
        },
      );

      const responseData = await readResponse(response);

      if (!response.ok) {
        throw new Error(extractErrorMessage(responseData));
      }

      const savedAnalysis = {
        ...responseData,
        job_description: jobDescription.trim(),
      };

      setAnalysisResult(savedAnalysis);

      try {
        localStorage.setItem(
          "careerPilotLatestAnalysis",
          JSON.stringify(savedAnalysis),
        );
      } catch {
        // The analysis remains available on screen if browser storage fails.
      }
    } catch (requestError) {
      if (requestError instanceof TypeError) {
        setError(
          `Unable to connect to the CareerPilot AI backend at ${API_BASE_URL}. Confirm that FastAPI is running and that CORS allows the current frontend address.`,
        );
        return;
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : "An unexpected CV analysis error occurred.",
      );
    } finally {
      setIsAnalysing(false);
    }
  }

  function resetForm() {
    if (isAnalysing) {
      return;
    }

    setSelectedFile(null);
    setJobDescription("");
    setIsDragging(false);
    setError("");
    setAnalysisResult(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  const analysis = getAnalysisData(analysisResult);

  const cvSkills = normaliseStringList(
    analysis?.cv_skills ?? analysis?.detected_skills,
  );

  const requiredSkills = normaliseStringList(
    analysis?.required_skills ?? analysis?.job_skills,
  );

  const matchedSkills = normaliseStringList(
    analysis?.matched_skills ?? analysis?.matching_skills,
  );

  const missingSkills = normaliseStringList(
    analysis?.missing_skills ?? analysis?.skill_gaps,
  );

  const priorityMissingSkills = normaliseStringList(
    analysis?.missing_skill_priority ??
      analysis?.priority_missing_skills,
  );

  const matchScore = getMatchScore(analysis);

  const matchLevel =
    analysis?.match_level ??
    analysis?.level ??
    analysis?.match_rating ??
    "";

  const careerRecommendation = getCareerRecommendation(analysis);

  const extractedCharacterCount =
    analysisResult?.extracted_character_count ??
    analysisResult?.character_count ??
    analysis?.extracted_character_count ??
    analysis?.character_count;

  const returnedFilename =
    analysisResult?.filename ??
    analysisResult?.file_name ??
    selectedFile?.name ??
    "";

  const canSubmit =
    Boolean(selectedFile) &&
    jobDescription.trim().length >= MIN_JOB_DESCRIPTION_LENGTH &&
    !isAnalysing;

  return (
    <main className="cv-upload-page">
      <section className="cv-upload-container">
        <header className="cv-upload-header">
          <Link className="back-link cv-back-link" to="/dashboard">
            <FiArrowLeft aria-hidden="true" />
            Back to dashboard
          </Link>

          <span className="eyebrow">CV analysis</span>

          <h1>Compare your CV with a job</h1>

          <p>
            Upload a PDF CV and provide a job description. CareerPilot AI will
            identify your skills, compare them with the role and highlight
            areas for development.
          </p>
        </header>

        <form className="cv-upload-card" onSubmit={handleSubmit} noValidate>
          <section
            className="cv-form-section"
            aria-labelledby="cv-file-heading"
          >
            <div className="cv-upload-card-heading">
              <span className="cv-step-number" aria-hidden="true">
                1
              </span>

              <FiFileText aria-hidden="true" />

              <div>
                <h2 id="cv-file-heading">Select your CV</h2>
                <p>Choose one PDF file no larger than 5 MB.</p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              id="cv-file"
              name="file"
              type="file"
              accept=".pdf,application/pdf"
              disabled={isAnalysing}
              onChange={handleFileChange}
              className="cv-native-file-input"
            />

            {!selectedFile ? (
              <div
                className={`cv-drop-zone ${
                  isDragging ? "cv-drop-zone-active" : ""
                }`}
                role="button"
                tabIndex={isAnalysing ? -1 : 0}
                aria-disabled={isAnalysing}
                onClick={openFilePicker}
                onKeyDown={(event) => {
                  if (
                    event.key === "Enter" ||
                    event.key === " "
                  ) {
                    event.preventDefault();
                    openFilePicker();
                  }
                }}

                 // Drag and drop events
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {/* Upload icon */}
                <FiUploadCloud aria-hidden="true" />

                <strong>Drag and drop your CV here</strong>

                <span>or choose a PDF from your computer</span>

                  {/* Open file browser */}
                <button
                  className="cv-file-picker-button"
                  type="button"
                  disabled={isAnalysing}
                  onClick={(event) => {
                    event.stopPropagation();
                    openFilePicker();
                  }}
                >
                  Choose PDF CV
                </button>
              </div>
            ) : (
              <div className="cv-selected-file" aria-live="polite">
                
                {/* File icon */}
                <FiFileText
                  className="cv-selected-file-icon"
                  aria-hidden="true"
                />

                {/* File information */}
                <div className="cv-selected-file-details">
                  <div>
                    <strong className="cv-selected-file-name">
                      {selectedFile.name}
                    </strong>
                    <div className="cv-selected-file-size">
                      {formatFileSize(selectedFile.size)}
                    </div>
                  </div>
                </div>

                <FiCheckCircle
                  className="cv-selected-file-success"
                  aria-label="File selected successfully"
                />

                {/* Remove selected file */}
                <button
                  className="cv-remove-file-button"
                  type="button"
                  disabled={isAnalysing}
                  aria-label={`Remove ${selectedFile.name}`}
                  onClick={removeSelectedFile}
                >
                  <FiX aria-hidden="true" />
                </button>
              </div>
            )}
          </section>

          {/* Job description section */}
          <section
            className="cv-form-section"
            aria-labelledby="job-description-heading"
          >
            <div className="cv-upload-card-heading">
              <span className="cv-step-number" aria-hidden="true">
                2
              </span>

              <FiBriefcase aria-hidden="true" />

              <div>
                <h2 id="job-description-heading">
                  Add the job description
                </h2>

                <p>
                  Paste the responsibilities, required skills and
                  qualifications from the vacancy.
                </p>
              </div>
            </div>

            <label
              className="cv-job-description-label"
              htmlFor="job-description"
            >
              Job description
            </label>

            {/* Job description input */}
            <textarea
              className="cv-job-description"
              id="job-description"
              name="job_description"
              value={jobDescription}
              disabled={isAnalysing}
              maxLength={MAX_JOB_DESCRIPTION_LENGTH}
              rows={10}
              placeholder="Paste the full job description here..."
              onChange={handleJobDescriptionChange}
              aria-describedby="job-description-counter"
            />

            <div
              id="job-description-counter"
              className="cv-character-counter"
              aria-live="polite"
            >
              {jobDescription.length.toLocaleString()} /{" "}
              {MAX_JOB_DESCRIPTION_LENGTH.toLocaleString()} characters
            </div>
          </section>

          {error && (
            <div
              className="form-message form-message-error"
              role="alert"
              aria-live="assertive"
            >
              <FiXCircle aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

           {/* Submit button */}
          <button
            className="primary-button full-width-button"
            type="submit"
            disabled={!canSubmit}
            aria-busy={isAnalysing}
          >
            {isAnalysing ? (
              <>
                <span
                  className="button-spinner"
                  aria-hidden="true"
                />
                Analysing your CV…
              </>
            ) : (
              <>
                <FiTarget aria-hidden="true" />
                Analyse my CV
              </>
            )}
          </button>
        </form>

        {analysisResult && (
          <section
            className="cv-analysis-results"
            aria-labelledby="analysis-results-heading"
          >
            <header className="cv-analysis-results-header">
              <div>
                <span className="eyebrow">Analysis complete</span>
                
                 {/* Results title */}
                <h2 id="analysis-results-heading">
                  Your CV analysis
                </h2>

                <p>
                  CareerPilot AI compared your CV with the supplied job
                  description.
                </p>
              </div>

              <FiCheckCircle
                className="cv-analysis-complete-icon"
                aria-hidden="true"
              />
            </header>

            <div className="cv-analysis-summary-grid">
              <article className="cv-result-card cv-score-card">
                <span className="cv-result-label">Job match score</span>

                <strong className="cv-match-score">
                  {Math.round(matchScore)}%
                </strong>

                <div
                  className="cv-score-progress"
                  role="progressbar"
                  aria-label="Job match score"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-valuenow={Math.round(matchScore)}
                >
                  <span style={{ width: `${matchScore}%` }} />
                </div>

                {matchLevel && (
                  <span className="cv-match-level">
                    {matchLevel}
                  </span>
                )}
              </article>

                {/* Matched skills */}
              <article className="cv-result-card">
                <span className="cv-result-label">Matched skills</span>
                <strong>{matchedSkills.length}</strong>
                <p>Skills found in both your CV and the vacancy.</p>
              </article>

                {/* Missing skills */}
              <article className="cv-result-card">
                <span className="cv-result-label">Missing skills</span>
                <strong>{missingSkills.length}</strong>
                <p>Requirements that were not clearly found in your CV.</p>
              </article>

              <article className="cv-result-card">
                <span className="cv-result-label">Detected CV skills</span>
                <strong>{cvSkills.length}</strong>
                <p>Skills identified from the uploaded document.</p>
              </article>
            </div>

              {/* Analysis details */}
            <div className="cv-analysis-details-grid">
              <article className="cv-result-panel">
                <h3>Matched skills</h3>

                {matchedSkills.length > 0 ? (
                  <ul className="cv-skill-list cv-skill-list-success">
                    {matchedSkills.map((skill) => (
                      <li key={`matched-${skill}`}>
                        <FiCheckCircle aria-hidden="true" />
                        <span>{skill}</span>
                      </li>
                    ))}
                  </ul>
                ) : (

                  
                  <p className="cv-empty-state">
                    No matched skills were returned for this analysis.
                  </p>
                )}
              </article>

              <article className="cv-result-panel">
                <h3>Missing skills</h3>

                {missingSkills.length > 0 ? (
                  <ul className="cv-skill-list cv-skill-list-warning">
                    {missingSkills.map((skill) => (
                      <li key={`missing-${skill}`}>
                        <FiXCircle aria-hidden="true" />
                        <span>{skill}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="cv-empty-state">
                    No missing skills were identified.
                  </p>
                )}
              </article>
            </div>

            {priorityMissingSkills.length > 0 && (
              <article className="cv-result-panel">
                <h3>Priority development areas</h3>

                <p>
                  These skills should receive the greatest attention when
                  preparing for this role.
                </p>

                <ul className="cv-skill-tags">
                  {priorityMissingSkills.map((skill) => (
                    <li key={`priority-${skill}`}>{skill}</li>
                  ))}
                </ul>
              </article>
            )}

            {/* Suggested career direction */}
            {careerRecommendation && (
              <article className="cv-result-panel cv-career-recommendation">
                <FiBriefcase aria-hidden="true" />

                <div>
                  <span className="cv-result-label">
                    Suggested career direction
                  </span>

                  <h3>{careerRecommendation}</h3>

                  <p>
                    View career recommendations to compare this pathway with other
                    career options based on your latest analysis.
                  </p>
                </div>
              </article>
            )}

            <details className="cv-additional-results">
              <summary>View additional analysis information</summary>

              <div className="cv-additional-results-content">
                {returnedFilename && (
                  <p>
                    <strong>Uploaded file:</strong> {returnedFilename}
                  </p>
                )}

                {typeof extractedCharacterCount === "number" && (
                  <p>
                    <strong>Extracted characters:</strong>{" "}
                    {extractedCharacterCount.toLocaleString()}
                  </p>
                )}

                <p>
                  <strong>Required skills detected:</strong>{" "}
                  {requiredSkills.length}
                </p>

                <p>
                  <strong>CV skills detected:</strong> {cvSkills.length}
                </p>
              </div>
            </details>

            <div className="cv-results-actions">

              {/* Analyse another CV */}
              <button
                className="secondary-button cv-secondary-button"
                type="button"
                onClick={resetForm}
              >
                <FiRefreshCw aria-hidden="true" />
                Analyse another CV
              </button>

              <Link
                className="secondary-button cv-secondary-button"
                to="/career-recommendations"
              >
                View career recommendations
              </Link>

                
              <Link className="primary-button" to="/dashboard">
                Return to dashboard
              </Link>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

export default UploadCV;