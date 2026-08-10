import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

// Authentication storage keys
const AUTH_STORAGE_KEYS = [
  "token",
  "access_token",
  "accessToken",
  "authToken",
  "careerPilotToken",
  "careerPilotUser",
  "currentUser",
  "user",
];

function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Navigation hook
  const navigate = useNavigate();

  // Close sidebar
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (!isSidebarOpen) {
      document.body.style.removeProperty("overflow");
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isSidebarOpen]);

  // sign out
  const handleSignOut = () => {
    AUTH_STORAGE_KEYS.forEach((key) => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    navigate("/login", { replace: true });
  };

  return (
    <div className="dashboard-shell">

      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onNavigate={() => setIsSidebarOpen(false)}
      />

      <div className="dashboard-shell__main">
        <Navbar
          isSidebarOpen={isSidebarOpen}
          onMenuToggle={() => {
            setIsSidebarOpen((currentValue) => !currentValue);
          }}
          onSignOut={handleSignOut}
        />

        {/* Main page content */}
        <main
          className="dashboard-shell__content"
          id="main-content"
          tabIndex="-1"
        >
          <Outlet />
        </main>
      </div>
       
       {/* Dashboard styles */}
      <style>{`
        :root {
          --dashboard-navy: #09132f;
          --dashboard-blue: #2f6deb;
          --dashboard-blue-dark: #2057c6;
          --dashboard-blue-soft: #eaf2ff;
          --dashboard-text: #111933;
          --dashboard-muted: #69738a;
          --dashboard-border: #e1e6ef;
          --dashboard-background: #f4f7fc;
          --dashboard-white: #ffffff;
          --dashboard-sidebar-width: 284px;
          --dashboard-navbar-height: 82px;
        }

        .dashboard-shell,
        .dashboard-shell *,
        .dashboard-shell *::before,
        .dashboard-shell *::after {
          box-sizing: border-box;
        }

        .dashboard-shell {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at 80% 10%,
              rgba(47, 109, 235, 0.1),
              transparent 30rem
            ),
            var(--dashboard-background);
          color: var(--dashboard-text);
        }

        .dashboard-shell__main {
          min-width: 0;
          min-height: 100vh;
          margin-left: var(--dashboard-sidebar-width);
        }

        .dashboard-shell__content {
          min-height: calc(100vh - var(--dashboard-navbar-height));
          outline: none;
        }


        .dashboard-navbar {
          position: sticky;
          z-index: 30;
          top: 0;
          display: flex;
          min-height: var(--dashboard-navbar-height);
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          padding: 1rem 2rem;
          border-bottom: 1px solid var(--dashboard-border);
          background: rgba(255, 255, 255, 0.94);
          box-shadow: 0 7px 24px rgba(20, 34, 67, 0.04);
          backdrop-filter: blur(16px);
        }

        .dashboard-navbar__left {
          display: flex;
          min-width: 0;
          align-items: center;
          gap: 0.9rem;
        }
        
         {/* Menu toggle button */}
        .dashboard-navbar__menu-button {
          display: none;
          width: 44px;
          height: 44px;
          flex: 0 0 auto;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--dashboard-border);
          border-radius: 13px;
          background: var(--dashboard-white);
          color: var(--dashboard-text);
          cursor: pointer;
        }

        .dashboard-navbar__eyebrow {
          margin: 0 0 0.15rem;
          color: var(--dashboard-blue);
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.16em;
          line-height: 1.2;
          text-transform: uppercase;
        }
         
        {/* Page title */}
        .dashboard-navbar__title {
          overflow: hidden;
          margin: 0;
          color: var(--dashboard-text);
          font-size: clamp(1.05rem, 2vw, 1.35rem);
          font-weight: 750;
          line-height: 1.2;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .dashboard-navbar__actions {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }

        {/* Action buttons */}
        .dashboard-navbar__icon-link,
        .dashboard-navbar__sign-out {
          display: inline-flex;
          min-height: 43px;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--dashboard-border);
          border-radius: 12px;
          background: var(--dashboard-white);
          color: var(--dashboard-text);
          font: inherit;
          font-weight: 700;
          text-decoration: none;
          cursor: pointer;
          transition:
            border-color 160ms ease,
            background-color 160ms ease,
            color 160ms ease,
            transform 160ms ease;
        }

        .dashboard-navbar__icon-link {
          width: 43px;
        }

        .dashboard-navbar__sign-out {
          gap: 0.5rem;
          padding: 0.65rem 0.95rem;
        }

        .dashboard-navbar__icon-link:hover,
        .dashboard-navbar__sign-out:hover {
          border-color: #c5d3ee;
          background: var(--dashboard-blue-soft);
          color: var(--dashboard-blue-dark);
          transform: translateY(-1px);
        }

        .dashboard-navbar__menu-button:focus-visible,
        .dashboard-navbar__icon-link:focus-visible,
        .dashboard-navbar__sign-out:focus-visible {
          outline: 3px solid rgba(47, 109, 235, 0.24);
          outline-offset: 2px;
        }

        /* Sidebar */
        .dashboard-sidebar {
          position: fixed;
          z-index: 50;
          inset: 0 auto 0 0;
          display: flex;
          width: var(--dashboard-sidebar-width);
          height: 100vh;
          flex-direction: column;
          overflow-y: auto;
          border-right: 1px solid rgba(255, 255, 255, 0.1);
          background:
            radial-gradient(
              circle at 5% 8%,
              rgba(64, 126, 255, 0.27),
              transparent 18rem
            ),
            linear-gradient(180deg, #111e44 0%, #09132f 100%);
          color: #ffffff;
          box-shadow: 15px 0 40px rgba(6, 16, 43, 0.1);
        }

        /* Sidebar brand */
        .dashboard-sidebar__brand {
          display: flex;
          min-height: 90px;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          padding: 1.2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .dashboard-sidebar__brand-link {
          display: flex;
          min-width: 0;
          align-items: center;
          gap: 0.8rem;
          color: #ffffff;
          text-decoration: none;
        }

        .dashboard-sidebar__brand-mark {
          display: inline-flex;
          width: 46px;
          height: 46px;
          flex: 0 0 auto;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.22);
          border-radius: 14px;
          background: linear-gradient(145deg, #3c7eff, #2059d3);
          box-shadow: 0 12px 24px rgba(13, 71, 190, 0.35);
          font-size: 0.92rem;
          font-weight: 900;
          letter-spacing: -0.03em;
        }

       /* Brand text */
        .dashboard-sidebar__brand strong,
        .dashboard-sidebar__brand small {
          display: block;
        }

        /* Brand title */
        .dashboard-sidebar__brand strong {
          font-size: 1.05rem;
          line-height: 1.25;
        }

        .dashboard-sidebar__brand small {
          overflow: hidden;
          margin-top: 0.1rem;
          color: rgba(255, 255, 255, 0.63);
          font-size: 0.72rem;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .dashboard-sidebar__close {
          display: none;
          width: 38px;
          height: 38px;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 11px;
          background: rgba(255, 255, 255, 0.07);
          color: #ffffff;
          font-size: 1.6rem;
          line-height: 1;
          cursor: pointer;
        }

        .dashboard-sidebar__navigation {
          flex: 1;
          padding: 1.15rem 0.8rem;
        }

        .dashboard-sidebar__section + .dashboard-sidebar__section {
          margin-top: 1.35rem;
        }

        .dashboard-sidebar__section-title {
          margin: 0 0 0.55rem;
          padding: 0 0.75rem;
          color: rgba(255, 255, 255, 0.47);
          font-size: 0.66rem;
          font-weight: 800;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }

        .dashboard-sidebar__list {
          display: grid;
          gap: 0.3rem;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .dashboard-sidebar__link {
          position: relative;
          display: flex;
          min-height: 48px;
          align-items: center;
          gap: 0.8rem;
          padding: 0.68rem 0.75rem;
          border: 1px solid transparent;
          border-radius: 13px;
          color: rgba(255, 255, 255, 0.72);
          font-size: 0.91rem;
          font-weight: 650;
          text-decoration: none;
          transition:
            background-color 150ms ease,
            border-color 150ms ease,
            color 150ms ease,
            transform 150ms ease;
        }

        .dashboard-sidebar__link:hover {
          border-color: rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.07);
          color: #ffffff;
          transform: translateX(2px);
        }

        .dashboard-sidebar__link--active {
          border-color: rgba(116, 164, 255, 0.34);
          background: linear-gradient(
            90deg,
            rgba(47, 109, 235, 0.37),
            rgba(47, 109, 235, 0.17)
          );
          color: #ffffff;
          box-shadow: inset 3px 0 0 #69a0ff;
        }

        .dashboard-sidebar__link-icon {
          display: inline-flex;
          width: 27px;
          flex: 0 0 auto;
          align-items: center;
          justify-content: center;
        }

        .dashboard-sidebar__link:focus-visible,
        .dashboard-sidebar__brand-link:focus-visible,
        .dashboard-sidebar__close:focus-visible {
          outline: 3px solid rgba(117, 167, 255, 0.56);
          outline-offset: 2px;
        }

        .dashboard-sidebar__footer {
          margin: 0.85rem;
          padding: 1rem;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.055);
        }

        .dashboard-sidebar__footer-label,
        .dashboard-sidebar__footer-text {
          margin: 0;
        }

        .dashboard-sidebar__footer-label {
          color: #ffffff;
          font-size: 0.78rem;
          font-weight: 800;
        }

        .dashboard-sidebar__footer-text {
          margin-top: 0.35rem;
          color: rgba(255, 255, 255, 0.58);
          font-size: 0.73rem;
          line-height: 1.55;
        }

        .dashboard-sidebar__backdrop {
          position: fixed;
          z-index: 40;
          inset: 0;
          display: none;
          width: 100%;
          height: 100%;
          padding: 0;
          border: 0;
          background: rgba(4, 10, 28, 0.55);
          opacity: 0;
          pointer-events: none;
          transition: opacity 180ms ease;
        }

        @media (max-width: 1050px) {
          .dashboard-shell__main {
            margin-left: 0;
          }

          .dashboard-navbar__menu-button,
          .dashboard-sidebar__close {
            display: inline-flex;
          }

          .dashboard-sidebar {
            transform: translateX(-105%);
            transition: transform 220ms ease;
          }

          .dashboard-sidebar--open {
            transform: translateX(0);
          }

          .dashboard-sidebar__backdrop {
            display: block;
          }

          .dashboard-sidebar__backdrop--visible {
            opacity: 1;
            pointer-events: auto;
          }
        }

        @media (max-width: 640px) {
          .dashboard-navbar {
            min-height: 72px;
            padding: 0.8rem 1rem;
          }

          .dashboard-navbar__eyebrow {
            display: none;
          }
          
          {/* Sign out button */}
          .dashboard-navbar__sign-out {
            width: 43px;
            padding: 0;
          }

          .dashboard-navbar__sign-out span {
            position: absolute;
            width: 1px;
            height: 1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
          }

          .dashboard-sidebar {
            width: min(88vw, 300px);
          }
        }

        {/* Reduce motion */}
        @media (prefers-reduced-motion: reduce) {
          .dashboard-shell *,
          .dashboard-shell *::before,
          .dashboard-shell *::after {
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}

export default DashboardLayout;