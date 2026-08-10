import { Link, useLocation } from "react-router-dom";

// Page titles
const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/upload-cv": "CV analysis",
  "/job-comparison": "Job comparison",
  "/career-recommendations": "Career recommendations",
  "/learning-roadmap": "Learning roadmap",
  "/interview-practice": "Interview practice",
  "/cover-letter": "Cover-letter builder",
  "/settings": "Settings",
};

function getPageTitle(pathname) {
  return PAGE_TITLES[pathname] || "CareerPilot AI";
}

// Menu icon
function MenuIcon({ open }) {
  if (open) {
    return (
      <svg
        aria-hidden="true"
        fill="none"
        height="22"
        viewBox="0 0 24 24"
        width="22"
      >
        <path
          d="M6 6l12 12M18 6L6 18"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
        />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="22"
      viewBox="0 0 24 24"
      width="22"
    >
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

// Settings icon
function SettingsIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
    >
      <path
        d="M12 15.25A3.25 3.25 0 1 0 12 8.75a3.25 3.25 0 0 0 0 6.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M19.1 13.4a7.5 7.5 0 0 0 0-2.8l2-1.55-2-3.46-2.5 1a8 8 0 0 0-2.42-1.4L13.8 2.5h-4l-.38 2.69A8 8 0 0 0 7 6.59l-2.5-1-2 3.46 2 1.55a7.5 7.5 0 0 0 0 2.8l-2 1.55 2 3.46 2.5-1a8 8 0 0 0 2.42 1.4l.38 2.69h4l.38-2.69a8 8 0 0 0 2.42-1.4l2.5 1 2-3.46-2-1.55Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

// Logout icon
function LogoutIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
    >
      <path
        d="M14 8V5.5A2.5 2.5 0 0 0 11.5 3h-5A2.5 2.5 0 0 0 4 5.5v13A2.5 2.5 0 0 0 6.5 21h5a2.5 2.5 0 0 0 2.5-2.5V16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M10 12h10m0 0-3.5-3.5M20 12l-3.5 3.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

// Navbar component
function Navbar({
  isSidebarOpen = false,
  onMenuToggle,
  onSignOut,
}) {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  return (
    <header className="dashboard-navbar">
      <div className="dashboard-navbar__left">
        <button
          aria-controls="career-sidebar"
          aria-expanded={isSidebarOpen}
          aria-label={isSidebarOpen ? "Close navigation" : "Open navigation"}
          className="dashboard-navbar__menu-button"
          onClick={onMenuToggle}
          type="button"
        >
          <MenuIcon open={isSidebarOpen} />
        </button>

        <div>
          <p className="dashboard-navbar__eyebrow">CareerPilot AI</p>
          <h1 className="dashboard-navbar__title">{pageTitle}</h1>
        </div>
      </div>

     
      <nav
        aria-label="Account navigation"
        className="dashboard-navbar__actions"
      >
        <Link
          aria-label="Open settings"
          className="dashboard-navbar__icon-link"
          title="Settings"
          to="/settings"
        >
          <SettingsIcon />
        </Link>

        
        <button
          className="dashboard-navbar__sign-out"
          onClick={onSignOut}
          type="button"
        >
          <LogoutIcon />
          <span>Sign out</span>
        </button>
      </nav>
    </header>
  );
}

export default Navbar;