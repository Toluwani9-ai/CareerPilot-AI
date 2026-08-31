import { NavLink } from "react-router-dom";

// Sidebar navigation sections
const navigationSections = [
  {
    label: "Overview",
    items: [
      {
        label: "Dashboard",
        path: "/dashboard",
        icon: "dashboard",
        end: true,
      },
    ],
  },
  {
    // Career analysis section
    label: "Career analysis",
    items: [
      {
        label: "Analyse CV",
        path: "/upload-cv",
        icon: "upload",
      },
      {
        label: "Job comparison",
        path: "/job-comparison",
        icon: "comparison",
      },
      {
        label: "Recommendations",
        path: "/career-recommendations",
        icon: "recommendation",
      },
      {
        label: "Learning roadmap",
        path: "/learning-roadmap",
        icon: "roadmap",
      },
    ],
  },
  {
    label: "Application tools",
    items: [
      {
        label: "Interview practice",
        path: "/interview-practice",
        icon: "interview",
      },
      {
         // Cover letter page
        label: "Cover letter",
        path: "/cover-letter",
        icon: "letter",
      },
    ],
  },
  {
    label: "Account",
    items: [
      {
        label: "Settings",
        path: "/settings",
        icon: "settings",
      },
    ],
  },
];

// Navigation icon
function NavigationIcon({ name }) {
  const commonProps = {
    "aria-hidden": true,
    fill: "none",
    height: 21,
    viewBox: "0 0 24 24",
    width: 21,
  };

  switch (name) {
    case "dashboard":
      return (
        <svg {...commonProps}>
          <rect
            height="7"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.7"
            width="7"
            x="3"
            y="3"
          />
          <rect
            height="7"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.7"
            width="7"
            x="14"
            y="3"
          />
          <rect
            height="7"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.7"
            width="7"
            x="3"
            y="14"
          />
          <rect
            height="7"
            rx="1.5"
            stroke="currentColor"
            strokeWidth="1.7"
            width="7"
            x="14"
            y="14"
          />
        </svg>
      );
    
    // Upload icon
    case "upload":
      return (
        <svg {...commonProps}>
          <path
            d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
          <path
            d="M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
        </svg>
      );

    case "comparison":
      return (
        <svg {...commonProps}>
          <path
            d="M7 4v16M17 4v16M3.5 8H10M14 16h6.5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
          <path
            d="m7 5 3 3-3 3M17 13l-3 3 3 3"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      );
    
    // Recommendation icon
    case "recommendation":
      return (
        <svg {...commonProps}>
          <path
            d="M8 20h8M9.5 16.5h5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
          <path
            d="M8.7 14.3A6 6 0 1 1 15.3 14.3c-.8.53-1.3 1.3-1.3 2.2h-4c0-.9-.5-1.67-1.3-2.2Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      );
    
    // Roadmap icon
    case "roadmap":
      return (
        <svg {...commonProps}>
          <circle
            cx="5"
            cy="18"
            r="2"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <circle
            cx="12"
            cy="6"
            r="2"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <circle
            cx="19"
            cy="16"
            r="2"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="m6.2 16.4 4.6-8.8m2.8.1 4.1 6.7"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.7"
          />
        </svg>
      );
   
    // Interview icon
    case "interview":
      return (
        <svg {...commonProps}>
          <path
            d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5v-8Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
          <path
            d="M8 8h8M8 12h5"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.7"
          />
        </svg>
      );

    // Cover letter icon
    case "letter":
      return (
        <svg {...commonProps}>
          <rect
            height="16"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.7"
            width="18"
            x="3"
            y="4"
          />
          <path
            d="m4.5 6 7.5 6 7.5-6"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
          />
        </svg>
      );
    // Settings icon
    case "settings":
      return (
        <svg {...commonProps}>
          <circle
            cx="12"
            cy="12"
            r="3"
            stroke="currentColor"
            strokeWidth="1.7"
          />
          <path
            d="m19 13.2 1.4 1.1-1.8 3.1-1.7-.7a7.2 7.2 0 0 1-2.1 1.2L14.5 20h-5l-.3-2.1a7.2 7.2 0 0 1-2.1-1.2l-1.7.7-1.8-3.1L5 13.2a7 7 0 0 1 0-2.4L3.6 9.7l1.8-3.1 1.7.7a7.2 7.2 0 0 1 2.1-1.2L9.5 4h5l.3 2.1a7.2 7.2 0 0 1 2.1 1.2l1.7-.7 1.8 3.1-1.4 1.1a7 7 0 0 1 0 2.4Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="1.4"
          />
        </svg>
      );

    default:
      return null;
  }
}

// Sidebar component
function Sidebar({
  isOpen = false,
  onClose,
  onNavigate,
}) {

   // controls navigation
  const handleNavigation = () => {
    onNavigate?.();
    onClose?.();
  };

  return (
    <>
      <button
        aria-label="Close navigation menu"
        className={`dashboard-sidebar__backdrop ${
          isOpen ? "dashboard-sidebar__backdrop--visible" : ""
        }`}
        onClick={onClose}
        tabIndex={isOpen ? 0 : -1}
        type="button"
      />

      <aside
        aria-label="Main navigation"
        className={`dashboard-sidebar ${
          isOpen ? "dashboard-sidebar--open" : ""
        }`}
        id="career-sidebar"
      >
        <div className="dashboard-sidebar__brand">
          <NavLink
            aria-label="CareerPilot dashboard"
            className="dashboard-sidebar__brand-link"
            onClick={handleNavigation}
            to="/dashboard"
          >
            <span className="dashboard-sidebar__brand-mark">CP</span>

            <span>
              <strong>CareerPilot</strong>
              <small>AI career workspace</small>
            </span>
          </NavLink>

          <button
            aria-label="Close navigation"
            className="dashboard-sidebar__close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
            
        <nav className="dashboard-sidebar__navigation">
          {navigationSections.map((section) => (
            <section
              className="dashboard-sidebar__section"
              key={section.label}
            >
              <h2 className="dashboard-sidebar__section-title">
              {section.label}
              </h2>
              {/* Create  link for pages */}
              <ul className="dashboard-sidebar__list">
                {section.items.map((item) => (
                  <li key={item.path}>
                    <NavLink
                      className={({ isActive }) =>
                        [
                          "dashboard-sidebar__link",
                          isActive
                            ? "dashboard-sidebar__link--active"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")
                      }
                      end={item.end}
                      onClick={handleNavigation}
                      to={item.path}
                    >
                      <span className="dashboard-sidebar__link-icon">
                        <NavigationIcon name={item.icon} />
                      </span>

                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>
        
        {/* Sidebar footer */}
        <div className="dashboard-sidebar__footer">
          <p className="dashboard-sidebar__footer-label">
            Your career workspace
          </p>

          {/* Footer description */}
          <p className="dashboard-sidebar__footer-text">
            Analyse experience, identify skill gaps and track the
            development.
          </p>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;