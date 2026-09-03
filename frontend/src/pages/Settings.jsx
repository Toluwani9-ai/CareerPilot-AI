import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// Local-storage key used to save the user's settings
const SETTINGS_STORAGE_KEY = "careerPilotSettings";

const ANALYSIS_STORAGE_KEYS = [
  "careerPilotLatestAnalysis",
  "careerPilotAnalysis",
  "latestCVAnalysis",
];

const ROADMAP_STORAGE_KEYS = [
  "careerPilotRoadmapProgress",
  "learningRoadmapProgress",
];

const COVER_LETTER_STORAGE_KEYS = [
  "careerPilotCoverLetter",
  "careerPilotCoverLetterDraft",
  "coverLetterDraft",
];

const INTERVIEW_STORAGE_KEYS = [
  "careerPilotInterviewProgress",
  "careerPilotInterviewAnswers",
  "interviewPracticeProgress",
];

const AUTH_STORAGE_KEYS = [
  "careerPilotToken",
  "careerPilotAuthToken",
  "access_token",
  "accessToken",
  "token",
  "authToken",
  "careerPilotUser",
  "currentUser",
  "user",
];
// Default values shown when the user has not entered any details. 
const DEFAULT_SETTINGS = {
  fullName: "",
  email: "",
  location: "",
  targetRole: "",
  experienceLevel: "entry",
  preferredWorkStyle: "hybrid",
  weeklyLearningGoal: "5",
  emailNotifications: true,
  analysisReminders: true,
  roadmapReminders: true,
  compactResults: false,
  reduceMotion: false,
};

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

// Reads JSON data from localStorage
function safelyReadJSON(key) {
  try {
    const rawValue = localStorage.getItem(key);

    if (!rawValue) {
      return null;
    }

    return JSON.parse(rawValue);
  } catch {
    return null;
  }
}

function getStoredUser() {
  const possibleUserKeys = [
    "careerPilotUser",
    "currentUser",
    "user",
  ];

  for (const key of possibleUserKeys) {
    const storedUser = safelyReadJSON(key);

    if (isPlainObject(storedUser)) {
      return storedUser;
    }
  }

  return {};
}
// saved settings and stored user details
function getInitialSettings() {
  const storedSettings = safelyReadJSON(SETTINGS_STORAGE_KEY);
  const storedUser = getStoredUser();

  const savedSettings = isPlainObject(storedSettings)
    ? storedSettings
    : {};

  return {
    ...DEFAULT_SETTINGS,
    ...savedSettings,
    fullName:
      savedSettings.fullName ||
      storedUser.full_name ||
      storedUser.fullName ||
      storedUser.name ||
      "",
    email:
      savedSettings.email ||
      storedUser.email ||
      "",
  };
}

function removeStorageKeys(keys) {
  keys.forEach((key) => {
    localStorage.removeItem(key);
  });
}

function getExportableCareerPilotData() {
  const exportData = {
    exportedAt: new Date().toISOString(),
    application: "CareerPilot AI",
    settings: safelyReadJSON(SETTINGS_STORAGE_KEY),
    analysis: {},
    roadmap: {},
    coverLetter: {},
    interviewPractice: {},
  };

  ANALYSIS_STORAGE_KEYS.forEach((key) => {
    const value = safelyReadJSON(key);

    if (value !== null) {
      exportData.analysis[key] = value;
    }
  });

  ROADMAP_STORAGE_KEYS.forEach((key) => {
    const value = safelyReadJSON(key);

    if (value !== null) {
      exportData.roadmap[key] = value;
    }
  });

  COVER_LETTER_STORAGE_KEYS.forEach((key) => {
    const value = safelyReadJSON(key);

    if (value !== null) {
      exportData.coverLetter[key] = value;
    }
  });

  INTERVIEW_STORAGE_KEYS.forEach((key) => {
    const value = safelyReadJSON(key);

    if (value !== null) {
      exportData.interviewPractice[key] = value;
    }
  });

  return exportData;
}
// settings icon used in the user interface.
function SettingsIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.5a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15.5 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.13.38.35.72.64 1 .3.27.68.42 1.08.4H21a2 2 0 1 1 0 4h-.09A1.7 1.7 0 0 0 19.4 15Z" />
    </svg>
  );
}

//user icon
function UserIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
      <path d="M10 21h4" />
    </svg>
  );
}
// database icon.
function DatabaseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <ellipse cx="12" cy="5" rx="8" ry="3" />
      <path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5" />
      <path d="M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M14 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

function Toggle({
  checked,
  description,
  label,
  name,
  onChange,
}) {
  return (
    <label className="settings-toggle-row">
      <span className="settings-toggle-copy">
        <span className="settings-toggle-label">{label}</span>
        <span className="settings-toggle-description">
          {description}
        </span>
      </span>

      <span className="settings-switch">
        <input
          checked={checked}
          name={name}
          onChange={onChange}
          type="checkbox"
        />
        <span className="settings-switch-track" aria-hidden="true">
          <span className="settings-switch-thumb" />
        </span>
      </span>
    </label>
  );
}

function ConfirmationDialog({
  actionLabel,
  children,
  danger = false,
  onCancel,
  onConfirm,
  open,
  title,
}) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="settings-dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <section
        aria-labelledby="settings-dialog-title"
        aria-modal="true"
        className="settings-dialog"
        role="dialog"
      >
        <div className="settings-dialog-icon">
          <DatabaseIcon />
        </div>

        <h2 id="settings-dialog-title">{title}</h2>

        <div className="settings-dialog-message">
          {children}
        </div>

        <div className="settings-dialog-actions">
          <button
            className="settings-button settings-button-secondary"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>

          <button
            className={
              danger
                ? "settings-button settings-button-danger"
                : "settings-button settings-button-primary"
            }
            onClick={onConfirm}
            type="button"
          >
            {actionLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function Settings() {
  const navigate = useNavigate();

  const [settings, setSettings] = useState(getInitialSettings);
  const [savedSettings, setSavedSettings] = useState(
    getInitialSettings,
  );
  const [statusMessage, setStatusMessage] = useState("");
  const [dialog, setDialog] = useState(null);

  const hasUnsavedChanges =
    JSON.stringify(settings) !== JSON.stringify(savedSettings);

  function updateField(event) {
    const { checked, name, type, value } = event.target;

    setSettings((currentSettings) => ({
      ...currentSettings,
      [name]: type === "checkbox" ? checked : value,
    }));

    setStatusMessage("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    const normalizedSettings = {
      ...settings,
      fullName: settings.fullName.trim(),
      email: settings.email.trim().toLowerCase(),
      location: settings.location.trim(),
      targetRole: settings.targetRole.trim(),
    };

    try {
      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(normalizedSettings),
      );

      setSettings(normalizedSettings);
      setSavedSettings(normalizedSettings);
      setStatusMessage("Your settings have been saved.");
    } catch {
      setStatusMessage(
        "Your browser could not save these settings. Check your storage permissions and try again.",
      );
    }
  }

  function handleDiscardChanges() {
    setSettings(savedSettings);
    setStatusMessage("Unsaved changes were discarded.");
  }

  function handleExportData() {
    try {
      const exportData = getExportableCareerPilotData();
      const jsonContent = JSON.stringify(exportData, null, 2);
      const fileBlob = new Blob([jsonContent], {
        type: "application/json",
      });

      const fileUrl = URL.createObjectURL(fileBlob);
      const downloadLink = document.createElement("a");
      const dateStamp = new Date()
        .toISOString()
        .slice(0, 10);

      downloadLink.href = fileUrl;
      downloadLink.download = `careerpilot-data-${dateStamp}.json`;

      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();

      URL.revokeObjectURL(fileUrl);

      setStatusMessage(
        "Your CareerPilot data export has been created.",
      );
    } catch {
      setStatusMessage(
        "The data export could not be created. Please try again.",
      );
    }
  }

  // removes saved CV analysis data after confirmation.
  function confirmClearAnalysis() {
    removeStorageKeys(ANALYSIS_STORAGE_KEYS);
    setDialog(null);
    setStatusMessage(
      "Saved CV analysis and job-comparison data were removed.",
    );
  }

  function confirmResetRoadmap() {
    removeStorageKeys(ROADMAP_STORAGE_KEYS);
    setDialog(null);
    setStatusMessage(
      "Your learning-roadmap progress was reset.",
    );
  }

  function confirmClearApplicationTools() {
    removeStorageKeys([
      ...COVER_LETTER_STORAGE_KEYS,
      ...INTERVIEW_STORAGE_KEYS,
    ]);

    setDialog(null);
    setStatusMessage(
      "Saved cover-letter and interview-practice data were removed.",
    );
  }

  function confirmResetAllData() {
    removeStorageKeys([
      ...ANALYSIS_STORAGE_KEYS,
      ...ROADMAP_STORAGE_KEYS,
      ...COVER_LETTER_STORAGE_KEYS,
      ...INTERVIEW_STORAGE_KEYS,
      SETTINGS_STORAGE_KEY,
    ]);

    const resetSettings = {
      ...DEFAULT_SETTINGS,
      email: settings.email,
      fullName: settings.fullName,
    };

    setSettings(resetSettings);
    setSavedSettings(resetSettings);
    setDialog(null);
    setStatusMessage(
      "CareerPilot preferences and saved activity were reset.",
    );
  }

  function confirmSignOut() {
    removeStorageKeys(AUTH_STORAGE_KEYS);
    sessionStorage.clear();

    setDialog(null);
    navigate("/login", { replace: true });
  }

  return (
    <main className="settings-page">
      <div className="settings-background-shape settings-shape-one" />
      <div className="settings-background-shape settings-shape-two" />

      <div className="settings-shell">
        <header className="settings-topbar">
          <Link
            className="settings-back-link"
            to="/dashboard"
          >
            <span aria-hidden="true">←</span>
            Back to dashboard
          </Link>

          <p className="settings-brand-label">
            CareerPilot AI · Account centre
          </p>
        </header>

        <section className="settings-hero">
          <div>
            <p className="settings-eyebrow">
              Account settings
            </p>

            <h1>
              Personalise your
              <br />
              CareerPilot experience.
            </h1>
          </div>

          <div className="settings-hero-copy">
            <p>
              Keep your profile information, career preferences
              and saved application data organised in one place.
            </p>

            <div className="settings-hero-note">
              <span className="settings-note-icon">
                <SettingsIcon />
              </span>

              <span>
                Your preferences are stored only in this browser
                unless they are also saved by your backend.
              </span>
            </div>
          </div>
        </section>

        {statusMessage && (
          <div
            aria-live="polite"
            className="settings-status-message"
            role="status"
          >
            <span className="settings-status-icon">
              <CheckIcon />
            </span>
            {statusMessage}
          </div>
        )}

        {/* Profile and career preferences */}
        <form onSubmit={handleSubmit}>
          <section className="settings-card">
            <div className="settings-section-heading">
              <span className="settings-section-icon">
                <UserIcon />
              </span>

              <div>
                <p className="settings-section-number">
                  Profile and career preferences
                </p>

                <h2>Tell CareerPilot about your goals</h2>

                <p>
                  These details help keep the experience relevant
                  to your current career direction.
                </p>
              </div>
            </div>

            <div className="settings-form-grid">
              <label className="settings-field">
                <span>Full name</span>
                <input
                  autoComplete="name"
                  maxLength={100}
                  name="fullName"
                  onChange={updateField}
                  placeholder="Enter your full name"
                  type="text"
                  value={settings.fullName}
                />
              </label>

              <label className="settings-field">
                <span>Email address</span>
                <input
                  autoComplete="email"
                  maxLength={150}
                  name="email"
                  onChange={updateField}
                  placeholder="name@example.com"
                  type="email"
                  value={settings.email}
                />
              </label>

              <label className="settings-field">
                <span>Location</span>
                <input
                  autoComplete="address-level2"
                  maxLength={100}
                  name="location"
                  onChange={updateField}
                  placeholder="City, country"
                  type="text"
                  value={settings.location}
                />
              </label>

              <label className="settings-field">
                <span>Target role</span>
                <input
                  maxLength={120}
                  name="targetRole"
                  onChange={updateField}
                  placeholder="For example, Junior Data Analyst"
                  type="text"
                  value={settings.targetRole}
                />
              </label>

              <label className="settings-field">
                <span>Experience level</span>
                <select
                  name="experienceLevel"
                  onChange={updateField}
                  value={settings.experienceLevel}
                >
                  <option value="student">
                    Student or recent graduate
                  </option>
                  <option value="entry">Entry level</option>
                  <option value="mid">Mid-level</option>
                  <option value="senior">Senior level</option>
                  <option value="career-change">
                    Changing career
                  </option>
                </select>
              </label>

              <label className="settings-field">
                <span>Preferred work style</span>
                <select
                  name="preferredWorkStyle"
                  onChange={updateField}
                  value={settings.preferredWorkStyle}
                >
                  <option value="onsite">On-site</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="remote">Remote</option>
                  <option value="flexible">
                    No strong preference
                  </option>
                </select>
              </label>

              <label className="settings-field settings-field-wide">
                <span>Weekly learning goal</span>
                <select
                  name="weeklyLearningGoal"
                  onChange={updateField}
                  value={settings.weeklyLearningGoal}
                >
                  <option value="2">2 hours per week</option>
                  <option value="5">5 hours per week</option>
                  <option value="8">8 hours per week</option>
                  <option value="10">10 hours per week</option>
                  <option value="15">15 or more hours</option>
                </select>
              </label>
            </div>

            <div className="settings-save-row">
              <p>
                {hasUnsavedChanges
                  ? "You have unsaved changes."
                  : "Your saved preferences are up to date."}
              </p>

              <div className="settings-inline-actions">
                {hasUnsavedChanges && (
                  <button
                    className="settings-button settings-button-secondary"
                    onClick={handleDiscardChanges}
                    type="button"
                  >
                    Discard changes
                  </button>
                )}

                <button
                  className="settings-button settings-button-primary"
                  disabled={!hasUnsavedChanges}
                  type="submit"
                >
                  Save settings
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          </section>
            
            {/* Notification and display */}
          <section className="settings-content-grid">
            <article className="settings-card settings-preferences-card">
              <div className="settings-section-heading compact">
                <span className="settings-section-icon">
                  <BellIcon />
                </span>

                <div>
                  <p className="settings-section-number">
                    Preferences
                  </p>
                  <h2>Notifications and display</h2>
                </div>
              </div>

              <div className="settings-toggle-list">
                <Toggle
                  checked={settings.emailNotifications}
                  description="Allow CareerPilot to use your saved email preference for important account messages."
                  label="Email notifications"
                  name="emailNotifications"
                  onChange={updateField}
                />

                <Toggle
                  checked={settings.analysisReminders}
                  description="Show reminders to run another CV analysis when your career information changes."
                  label="CV-analysis reminders"
                  name="analysisReminders"
                  onChange={updateField}
                />

                <Toggle
                  checked={settings.roadmapReminders}
                  description="Display prompts encouraging you to continue your learning-roadmap activities."
                  label="Roadmap reminders"
                  name="roadmapReminders"
                  onChange={updateField}
                />

                <Toggle
                  checked={settings.compactResults}
                  description="Use a more compact layout when displaying analysis cards and skill lists."
                  label="Compact results"
                  name="compactResults"
                  onChange={updateField}
                />

                <Toggle
                  checked={settings.reduceMotion}
                  description="Reduce decorative animations and transitions throughout the interface."
                  label="Reduce motion"
                  name="reduceMotion"
                  onChange={updateField}
                />
              </div>
            </article>

            {/* Continue your career work */}
            <article className="settings-card settings-navigation-card">
              <div className="settings-section-heading compact">
                <span className="settings-section-icon">
                  <SettingsIcon />
                </span>

                <div>
                  <p className="settings-section-number">
                    Quick navigation
                  </p>
                  <h2>Continue your career work</h2>
                </div>
              </div>

              <nav
                aria-label="CareerPilot settings navigation"
                className="settings-navigation-list"
              >
                <Link to="/upload-cv">
                  <span>
                    <strong>Run a new CV analysis</strong>
                    <small>
                      Upload a PDF and compare it with a vacancy.
                    </small>
                  </span>
                  <span aria-hidden="true">→</span>
                </Link>

                <Link to="/job-comparison">
                  <span>
                    <strong>View job comparison</strong>
                    <small>
                      Review matched and missing job skills.
                    </small>
                  </span>
                  <span aria-hidden="true">→</span>
                </Link>

                <Link to="/career-recommendations">
                  <span>
                    <strong>Career recommendations</strong>
                    <small>
                      Explore pathways based on your latest result.
                    </small>
                  </span>
                  <span aria-hidden="true">→</span>
                </Link>

                <Link to="/learning-roadmap">
                  <span>
                    <strong>Learning roadmap</strong>
                    <small>
                      Continue your personalised development plan.
                    </small>
                  </span>
                  <span aria-hidden="true">→</span>
                </Link>
              </nav>
            </article>
          </section>
        </form>

        {/* Manage your CareerPilot information */}
        <section className="settings-card settings-data-card">
          <div className="settings-section-heading">
            <span className="settings-section-icon">
              <DatabaseIcon />
            </span>

            <div>
              <p className="settings-section-number">
                Saved data
              </p>

              <h2>Manage your CareerPilot information</h2>

              <p>
                Export a personal copy or remove selected browser
                data without affecting unrelated website storage.
              </p>
            </div>
          </div>

          <div className="settings-data-actions">
            <article className="settings-data-action">
              <div>
                <h3>Export CareerPilot data</h3>
                <p>
                  Download your locally saved analysis, roadmap,
                  preferences and application-tool information.
                </p>
              </div>

              <button
                className="settings-button settings-button-secondary"
                onClick={handleExportData}
                type="button"
              >
                <DownloadIcon />
                Export JSON
              </button>
            </article>

            <article className="settings-data-action">
              <div>
                <h3>Clear CV-analysis data</h3>
                <p>
                  Remove the latest CV analysis, comparison and
                  recommendation information saved in this browser.
                </p>
              </div>

              <button
                className="settings-button settings-button-secondary"
                onClick={() => setDialog("analysis")}
                type="button"
              >
                Clear analysis
              </button>
            </article>

            <article className="settings-data-action">
              <div>
                <h3>Reset roadmap progress</h3>
                <p>
                  Uncheck all completed learning activities while
                  retaining your account preferences.
                </p>
              </div>

              <button
                className="settings-button settings-button-secondary"
                onClick={() => setDialog("roadmap")}
                type="button"
              >
                Reset roadmap
              </button>
            </article>

            <article className="settings-data-action">
              <div>
                <h3>Clear application-tool drafts</h3>
                <p>
                  Remove saved cover-letter drafts and interview
                  practice progress from this browser.
                </p>
              </div>

              <button
                className="settings-button settings-button-secondary"
                onClick={() => setDialog("tools")}
                type="button"
              >
                Clear drafts
              </button>
            </article>
          </div>
        </section>

        {/* Reset data or leave your session */}
        <section className="settings-card settings-danger-zone">
          <div>
            <p className="settings-danger-label">
              Account actions
            </p>
            <h2>Reset data or leave your session</h2>
            <p>
              These actions can remove saved browser information.
              Export your data first when you need a personal copy.
            </p>
          </div>

          <div className="settings-danger-actions">
            <button
              className="settings-button settings-button-outline-danger"
              onClick={() => setDialog("all")}
              type="button"
            >
              Reset CareerPilot data
            </button>

            <button
              className="settings-button settings-button-danger"
              onClick={() => setDialog("logout")}
              type="button"
            >
              <LogoutIcon />
              Sign out
            </button>
          </div>
        </section>

        <footer className="settings-footer">
          <p>
            CareerPilot AI uses analysis results as guidance. Review
            important career decisions using your own judgement and
            trusted professional advice.
          </p>

          <Link to="/dashboard">Return to dashboard</Link>
        </footer>
      </div>

      <ConfirmationDialog
        actionLabel="Clear analysis"
        danger
        onCancel={() => setDialog(null)}
        onConfirm={confirmClearAnalysis}
        open={dialog === "analysis"}
        title="Clear saved CV analysis?"
      >
        <p>
          Your latest CV analysis, job comparison and related
          recommendations will be removed from this browser.
        </p>
        <p>This action cannot be undone.</p>
      </ConfirmationDialog>

      <ConfirmationDialog
        actionLabel="Reset progress"
        danger
        onCancel={() => setDialog(null)}
        onConfirm={confirmResetRoadmap}
        open={dialog === "roadmap"}
        title="Reset learning-roadmap progress?"
      >
        <p>
          All locally completed roadmap activities will be marked as
          incomplete.
        </p>
        <p>Your latest CV analysis will not be removed.</p>
      </ConfirmationDialog>

      <ConfirmationDialog
        actionLabel="Clear saved drafts"
        danger
        onCancel={() => setDialog(null)}
        onConfirm={confirmClearApplicationTools}
        open={dialog === "tools"}
        title="Clear application-tool data?"
      >
        <p>
          Saved cover-letter drafts and interview-practice progress
          will be removed from this browser.
        </p>
      </ConfirmationDialog>

      <ConfirmationDialog
        actionLabel="Reset all data"
        danger
        onCancel={() => setDialog(null)}
        onConfirm={confirmResetAllData}
        open={dialog === "all"}
        title="Reset CareerPilot browser data?"
      >
        <p>
          This removes your locally saved analysis, roadmap progress,
          application-tool drafts and preferences.
        </p>
        <p>Your active sign-in session will remain available.</p>
      </ConfirmationDialog>

      <ConfirmationDialog
        actionLabel="Sign out"
        danger
        onCancel={() => setDialog(null)}
        onConfirm={confirmSignOut}
        open={dialog === "logout"}
        title="Sign out of CareerPilot?"
      >
        <p>
          Your authentication information will be removed from this
          browser and you will return to the sign-in page.
        </p>
      </ConfirmationDialog>

      <style>{`
        .settings-page,
        .settings-page * {
          box-sizing: border-box;
        }

        .settings-page {
          --settings-navy: #10172f;
          --settings-blue: #2f6eec;
          --settings-blue-dark: #2159c8;
          --settings-muted: #687287;
          --settings-border: rgba(16, 23, 47, 0.14);
          --settings-surface: rgba(255, 255, 255, 0.93);
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          color: var(--settings-navy);
          background:
            radial-gradient(
              circle at 50% 5%,
              rgba(174, 207, 255, 0.42),
              transparent 32%
            ),
            linear-gradient(
              135deg,
              #f8f6ff 0%,
              #edf7ff 54%,
              #f8f5ff 100%
            );
          padding: 0 0 56px;
        }

        .settings-background-shape {
          position: absolute;
          pointer-events: none;
          border-radius: 999px;
          filter: blur(4px);
        }

        .settings-shape-one {
          width: 440px;
          height: 440px;
          top: 250px;
          right: -220px;
          border: 1px solid rgba(47, 110, 236, 0.1);
        }

        .settings-shape-two {
          width: 340px;
          height: 340px;
          left: -170px;
          bottom: 300px;
          border: 1px solid rgba(120, 120, 215, 0.1);
        }

        .settings-shell {
          position: relative;
          z-index: 1;
          width: min(1360px, calc(100% - 64px));
          margin: 0 auto;
        }

        .settings-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          min-height: 112px;
        }

        .settings-back-link {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          color: var(--settings-navy);
          font-weight: 750;
          text-decoration: none;
          font-size: 1rem;
        }

        .settings-back-link:hover {
          color: var(--settings-blue);
        }

        .settings-brand-label,
        .settings-eyebrow,
        .settings-section-number,
        .settings-danger-label {
          margin: 0;
          color: var(--settings-blue);
          font-size: 0.78rem;
          line-height: 1.4;
          font-weight: 800;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        .settings-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(340px, 0.85fr);
          align-items: end;
          gap: 72px;
          padding: 68px 0 72px;
        }

        .settings-hero h1 {
          max-width: 760px;
          margin: 24px 0 0;
          font-size: clamp(3rem, 6vw, 5.8rem);
          line-height: 0.94;
          letter-spacing: -0.065em;
          font-weight: 760;
        }

        .settings-hero-copy {
          padding-bottom: 12px;
        }

        .settings-hero-copy > p {
          margin: 0;
          color: var(--settings-muted);
          font-size: clamp(1.1rem, 2vw, 1.35rem);
          line-height: 1.75;
        }

        .settings-hero-note {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          margin-top: 26px;
          padding: 18px 20px;
          border: 1px solid rgba(47, 110, 236, 0.15);
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.48);
          color: #535f75;
          line-height: 1.55;
        }

        .settings-note-icon,
        .settings-section-icon,
        .settings-status-icon {
          flex: 0 0 auto;
          display: inline-grid;
          place-items: center;
          color: var(--settings-blue);
        }

        .settings-note-icon {
          width: 24px;
          height: 24px;
        }

        .settings-note-icon svg,
        .settings-section-icon svg,
        .settings-status-icon svg,
        .settings-button svg {
          width: 100%;
          height: 100%;
        }

        .settings-status-message {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 0 0 22px;
          padding: 16px 20px;
          border: 1px solid rgba(29, 163, 92, 0.25);
          border-radius: 16px;
          background: rgba(231, 251, 239, 0.93);
          color: #17663b;
          font-weight: 700;
        }

        .settings-status-icon {
          width: 22px;
          height: 22px;
          color: #1ca85f;
        }

        {/* End Notifications and Display Card, and also style other cards  */}
        .settings-card {
          border: 1px solid var(--settings-border);
          border-radius: 30px;
          background: var(--settings-surface);
          box-shadow: 0 24px 70px rgba(38, 52, 94, 0.08);
          backdrop-filter: blur(16px);
        }

        .settings-card + .settings-card {
          margin-top: 28px;
        }

        .settings-card {
          padding: 44px;
        }

        .settings-section-heading {
          display: flex;
          align-items: flex-start;
          gap: 22px;
          margin-bottom: 34px;
        }

        .settings-section-heading.compact {
          margin-bottom: 26px;
        }

        .settings-section-icon {
          width: 52px;
          height: 52px;
          padding: 13px;
          border-radius: 17px;
          background: #edf4ff;
        }

        .settings-section-heading h2 {
          margin: 8px 0 8px;
          font-size: clamp(1.65rem, 3vw, 2.35rem);
          line-height: 1.1;
          letter-spacing: -0.035em;
        }

        .settings-section-heading p:last-child {
          max-width: 760px;
          margin: 0;
          color: var(--settings-muted);
          line-height: 1.65;
        }

        .settings-form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 24px;
        }

        .settings-field {
          display: grid;
          gap: 10px;
        }

        .settings-field-wide {
          grid-column: 1 / -1;
        }

        .settings-field > span {
          font-weight: 750;
        }

        .settings-field input,
        .settings-field select {
          width: 100%;
          min-height: 58px;
          border: 1px solid rgba(16, 23, 47, 0.18);
          border-radius: 16px;
          outline: none;
          background: #fff;
          color: var(--settings-navy);
          padding: 0 17px;
          font: inherit;
          transition:
            border-color 160ms ease,
            box-shadow 160ms ease;
        }

        .settings-field input:focus,
        .settings-field select:focus {
          border-color: var(--settings-blue);
          box-shadow: 0 0 0 4px rgba(47, 110, 236, 0.12);
        }

        .settings-field input::placeholder {
          color: #9aa2b0;
        }

        .settings-save-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          margin-top: 34px;
          padding-top: 30px;
          border-top: 1px solid var(--settings-border);
        }

        .settings-save-row p {
          margin: 0;
          color: var(--settings-muted);
        }

        .settings-inline-actions,
        .settings-danger-actions,
        .settings-dialog-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .settings-button {
          min-height: 50px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: 1px solid transparent;
          border-radius: 14px;
          padding: 0 20px;
          font: inherit;
          font-weight: 780;
          cursor: pointer;
          text-decoration: none;
          transition:
            transform 150ms ease,
            box-shadow 150ms ease,
            border-color 150ms ease,
            background-color 150ms ease;
        }

        .settings-button:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .settings-button:focus-visible {
          outline: 3px solid rgba(47, 110, 236, 0.25);
          outline-offset: 3px;
        }

        .settings-button:disabled {
          opacity: 0.46;
          cursor: not-allowed;
        }

        .settings-button svg {
          width: 19px;
          height: 19px;
        }

        .settings-button-primary {
          color: #fff;
          background: var(--settings-blue);
          box-shadow: 0 12px 28px rgba(47, 110, 236, 0.22);
        }

        .settings-button-primary:hover:not(:disabled) {
          background: var(--settings-blue-dark);
        }

        .settings-button-secondary {
          border-color: rgba(16, 23, 47, 0.16);
          color: var(--settings-navy);
          background: #fff;
        }

        .settings-button-secondary:hover:not(:disabled) {
          border-color: rgba(47, 110, 236, 0.42);
          background: #f8fbff;
        }

        .settings-button-danger {
          color: #fff;
          background: #c73b3b;
          box-shadow: 0 12px 26px rgba(199, 59, 59, 0.18);
        }

        .settings-button-danger:hover:not(:disabled) {
          background: #aa2f2f;
        }

        .settings-button-outline-danger {
          color: #a52f2f;
          border-color: rgba(199, 59, 59, 0.28);
          background: #fff;
        }

        .settings-content-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 28px;
          margin: 28px 0;
        }

        .settings-content-grid .settings-card {
          margin: 0;
        }

        .settings-toggle-list {
          display: grid;
        }

        .settings-toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 22px;
          padding: 21px 0;
          border-top: 1px solid var(--settings-border);
          cursor: pointer;
        }

        .settings-toggle-row:first-child {
          border-top: 0;
          padding-top: 4px;
        }

        .settings-toggle-copy {
          display: grid;
          gap: 5px;
        }

        .settings-toggle-label {
          font-weight: 780;
        }

        .settings-toggle-description {
          color: var(--settings-muted);
          font-size: 0.92rem;
          line-height: 1.55;
        }

        .settings-switch {
          flex: 0 0 auto;
          position: relative;
        }

        .settings-switch input {
          position: absolute;
          width: 1px;
          height: 1px;
          opacity: 0;
        }

        .settings-switch-track {
          display: block;
          width: 54px;
          height: 30px;
          padding: 3px;
          border-radius: 999px;
          background: #cfd5df;
          transition: background-color 160ms ease;
        }

        .settings-switch-thumb {
          display: block;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 2px 8px rgba(16, 23, 47, 0.22);
          transition: transform 160ms ease;
        }

        .settings-switch input:checked + .settings-switch-track {
          background: var(--settings-blue);
        }

        .settings-switch
          input:checked
          + .settings-switch-track
          .settings-switch-thumb {
          transform: translateX(24px);
        }

        .settings-switch input:focus-visible + .settings-switch-track {
          outline: 3px solid rgba(47, 110, 236, 0.25);
          outline-offset: 3px;
        }

        {/* Quick navigation card content */}
        .settings-navigation-list {
          display: grid;
        }

        .settings-navigation-list a {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          padding: 21px 0;
          border-top: 1px solid var(--settings-border);
          color: var(--settings-navy);
          text-decoration: none;
        }

        .settings-navigation-list a:first-child {
          border-top: 0;
          padding-top: 4px;
        }

        .settings-navigation-list a:hover {
          color: var(--settings-blue);
        }

        .settings-navigation-list a > span:first-child {
          display: grid;
          gap: 5px;
        }

        .settings-navigation-list small {
          color: var(--settings-muted);
          font-size: 0.92rem;
          line-height: 1.45;
        }

        .settings-data-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .settings-data-action {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          min-height: 166px;
          padding: 26px;
          border: 1px solid var(--settings-border);
          border-radius: 20px;
          background: rgba(248, 250, 255, 0.72);
        }

        .settings-data-action h3 {
          margin: 0 0 8px;
          font-size: 1.08rem;
        }

        .settings-data-action p {
          margin: 0;
          color: var(--settings-muted);
          font-size: 0.92rem;
          line-height: 1.55;
        }

        .settings-data-action .settings-button {
          flex: 0 0 auto;
        }

        {/* Reset data or leave your session */}
        .settings-danger-zone {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 36px;
          margin-top: 28px;
          border-color: rgba(199, 59, 59, 0.18);
          background:
            linear-gradient(
              115deg,
              rgba(255, 250, 250, 0.98),
              rgba(255, 244, 244, 0.88)
            );
        }

        .settings-danger-zone h2 {
          margin: 8px 0;
          font-size: 1.65rem;
        }

        .settings-danger-zone p:last-child {
          max-width: 680px;
          margin: 0;
          color: var(--settings-muted);
          line-height: 1.6;
        }

        .settings-danger-label {
          color: #b13737;
        }

        .settings-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 28px;
          padding: 34px 4px 0;
          color: var(--settings-muted);
          font-size: 0.9rem;
          line-height: 1.55;
        }

        .settings-footer p {
          max-width: 800px;
          margin: 0;
        }

        .settings-footer a {
          flex: 0 0 auto;
          color: var(--settings-blue);
          font-weight: 760;
          text-decoration: none;
        }

        .settings-dialog-backdrop {
          position: fixed;
          z-index: 1000;
          inset: 0;
          display: grid;
          place-items: center;
          padding: 24px;
          background: rgba(9, 15, 35, 0.58);
          backdrop-filter: blur(8px);
        }

        .settings-dialog {
          width: min(500px, 100%);
          padding: 34px;
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 26px;
          background: #fff;
          box-shadow: 0 30px 90px rgba(8, 15, 38, 0.3);
        }

        .settings-dialog-icon {
          width: 54px;
          height: 54px;
          display: grid;
          place-items: center;
          margin-bottom: 22px;
          padding: 14px;
          border-radius: 17px;
          color: #bd3535;
          background: #fff1f1;
        }

        .settings-dialog-icon svg {
          width: 100%;
          height: 100%;
        }

        .settings-dialog h2 {
          margin: 0 0 14px;
          font-size: 1.65rem;
          letter-spacing: -0.025em;
        }

        .settings-dialog-message {
          color: var(--settings-muted);
          line-height: 1.6;
        }

        .settings-dialog-message p {
          margin: 8px 0;
        }

        .settings-dialog-actions {
          justify-content: flex-end;
          margin-top: 28px;
        }

        @media (max-width: 1050px) {
          .settings-hero {
            grid-template-columns: 1fr;
            gap: 34px;
          }

          .settings-hero-copy {
            max-width: 780px;
          }

          .settings-content-grid,
          .settings-data-actions {
            grid-template-columns: 1fr;
          }

          .settings-danger-zone {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (max-width: 760px) {
          .settings-shell {
            width: min(100% - 28px, 1360px);
          }

          .settings-topbar {
            min-height: 88px;
          }

          .settings-brand-label {
            display: none;
          }

          .settings-hero {
            padding: 40px 0 48px;
          }

          .settings-hero h1 {
            font-size: clamp(2.8rem, 14vw, 4.2rem);
          }

          .settings-card {
            padding: 26px 20px;
            border-radius: 23px;
          }

          .settings-section-heading {
            gap: 15px;
          }

          .settings-section-icon {
            width: 44px;
            height: 44px;
            padding: 11px;
          }

          .settings-form-grid {
            grid-template-columns: 1fr;
          }

          .settings-field-wide {
            grid-column: auto;
          }

          .settings-save-row,
          .settings-data-action {
            align-items: stretch;
            flex-direction: column;
          }

          .settings-inline-actions,
          .settings-danger-actions {
            width: 100%;
          }

          .settings-inline-actions .settings-button,
          .settings-danger-actions .settings-button,
          .settings-data-action .settings-button {
            width: 100%;
          }

          .settings-footer {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (max-width: 500px) {
          .settings-toggle-row {
            align-items: flex-start;
          }

          .settings-dialog {
            padding: 26px 20px;
          }

          .settings-dialog-actions {
            align-items: stretch;
            flex-direction: column-reverse;
          }

          .settings-dialog-actions .settings-button {
            width: 100%;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .settings-page *,
          .settings-page *::before,
          .settings-page *::after {
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>
    </main>
  );
}

export default Settings;