import { Link, useLocation, useNavigate } from "react-router-dom";

function NotFound() {
  const location = useLocation();
  const navigate = useNavigate();

  const requestedPath = location.pathname || "/unknown-page";

  const handleGoBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }

    navigate("/dashboard");
  };

  return (
    <main className="not-found-page">
      <section className="not-found-shell" aria-labelledby="not-found-title">
        <div className="not-found-topbar">
          <Link className="not-found-brand" to="/dashboard">
            CareerPilot AI
          </Link>

          <span className="not-found-category">
            Navigation assistance
          </span>
        </div>

        <div className="not-found-content">
          <div className="not-found-copy">
            <span className="not-found-eyebrow">Error 404</span>

            <h1 id="not-found-title">
              This career route could not be found.
            </h1>

            <p className="not-found-description">
              The address may be incorrect, the page may have moved, or the
              feature may no longer be available.
            </p>

            <div className="not-found-path" aria-label="Requested address">
              <span>Requested page</span>
              <code>{requestedPath}</code>
            </div>

            <div className="not-found-actions">
              <Link className="not-found-primary-button" to="/dashboard">
                Return to dashboard
                <span aria-hidden="true">→</span>
              </Link>

              <button
                className="not-found-secondary-button"
                type="button"
                onClick={handleGoBack}
              >
                <span aria-hidden="true">←</span>
                Go back
              </button>
            </div>
          </div>

          <div className="not-found-visual" aria-hidden="true">
            <div className="not-found-orbit not-found-orbit-large" />
            <div className="not-found-orbit not-found-orbit-small" />

            <div className="not-found-number">
              <span>4</span>

              <div className="not-found-compass">
                <span className="not-found-compass-point" />
                <span className="not-found-compass-centre" />
              </div>

              <span>4</span>
            </div>
          </div>
        </div>

        <div className="not-found-support">
          <div>
            <span className="not-found-support-label">
              Continue your CareerPilot journey
            </span>

            <p>
              Choose one of the main areas below to continue working with your
              latest CV analysis.
            </p>
          </div>

          <nav
            className="not-found-links"
            aria-label="Useful CareerPilot pages"
          >
            <Link to="/upload-cv">Analyse a CV</Link>
            <Link to="/job-comparison">Job comparison</Link>
            <Link to="/career-recommendations">
              Career recommendations
            </Link>
            <Link to="/learning-roadmap">Learning roadmap</Link>
          </nav>
        </div>
      </section>

      <style>{`
        .not-found-page {
          min-height: 100vh;
          padding: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(
              circle at 18% 18%,
              rgba(94, 163, 255, 0.18),
              transparent 28%
            ),
            radial-gradient(
              circle at 82% 78%,
              rgba(180, 157, 255, 0.18),
              transparent 30%
            ),
            linear-gradient(135deg, #f8f7ff 0%, #eef6ff 100%);
          color: #0c1734;
          box-sizing: border-box;
        }

        .not-found-page *,
        .not-found-page *::before,
        .not-found-page *::after {
          box-sizing: border-box;
        }

        .not-found-shell {
          width: min(1380px, 100%);
          overflow: hidden;
          border: 1px solid rgba(28, 53, 96, 0.12);
          border-radius: 34px;
          background: rgba(255, 255, 255, 0.94);
          box-shadow: 0 30px 80px rgba(32, 58, 105, 0.12);
        }

        .not-found-topbar {
          padding: 30px 42px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          border-bottom: 1px solid rgba(28, 53, 96, 0.1);
        }

        .not-found-brand {
          color: #0b1734;
          font-size: 1.2rem;
          font-weight: 800;
          text-decoration: none;
          letter-spacing: -0.02em;
        }

        .not-found-category {
          color: #2872e8;
          font-size: 0.78rem;
          font-weight: 800;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        .not-found-content {
          min-height: 620px;
          padding: 72px 64px;
          display: grid;
          grid-template-columns: minmax(0, 1.05fr) minmax(360px, 0.95fr);
          align-items: center;
          gap: 70px;
        }

        .not-found-copy {
          max-width: 720px;
        }

        .not-found-eyebrow {
          display: inline-block;
          margin-bottom: 24px;
          color: #2b73e8;
          font-size: 0.88rem;
          font-weight: 800;
          letter-spacing: 0.22em;
          text-transform: uppercase;
        }

        .not-found-copy h1 {
          margin: 0;
          max-width: 760px;
          font-size: clamp(3.4rem, 6vw, 6.6rem);
          line-height: 0.94;
          letter-spacing: -0.065em;
        }

        .not-found-description {
          max-width: 660px;
          margin: 32px 0 0;
          color: #63708a;
          font-size: 1.2rem;
          line-height: 1.75;
        }

        .not-found-path {
          width: fit-content;
          max-width: 100%;
          margin-top: 32px;
          padding: 15px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid rgba(41, 101, 199, 0.14);
          border-radius: 14px;
          background: #f7faff;
          color: #67738a;
        }

        .not-found-path span {
          flex-shrink: 0;
          font-size: 0.9rem;
          font-weight: 700;
        }

        .not-found-path code {
          overflow: hidden;
          color: #174b9a;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            monospace;
          font-size: 0.88rem;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .not-found-actions {
          margin-top: 38px;
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
        }

        .not-found-primary-button,
        .not-found-secondary-button {
          min-height: 56px;
          padding: 0 24px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          border-radius: 14px;
          font: inherit;
          font-weight: 800;
          text-decoration: none;
          cursor: pointer;
          transition:
            transform 160ms ease,
            box-shadow 160ms ease,
            border-color 160ms ease,
            background-color 160ms ease;
        }

        .not-found-primary-button {
          border: 1px solid #2e6fea;
          background: #2e6fea;
          color: #ffffff;
          box-shadow: 0 14px 30px rgba(46, 111, 234, 0.24);
        }

        .not-found-secondary-button {
          border: 1px solid rgba(20, 42, 79, 0.18);
          background: #ffffff;
          color: #142a4f;
        }

        .not-found-primary-button:hover,
        .not-found-secondary-button:hover {
          transform: translateY(-2px);
        }

        .not-found-primary-button:hover {
          box-shadow: 0 18px 36px rgba(46, 111, 234, 0.3);
        }

        .not-found-secondary-button:hover {
          border-color: rgba(46, 111, 234, 0.38);
          background: #f8fbff;
        }

        .not-found-primary-button:focus-visible,
        .not-found-secondary-button:focus-visible,
        .not-found-brand:focus-visible,
        .not-found-links a:focus-visible {
          outline: 3px solid rgba(46, 111, 234, 0.35);
          outline-offset: 4px;
        }

        .not-found-visual {
          position: relative;
          min-height: 460px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 1px solid rgba(28, 53, 96, 0.1);
          border-radius: 32px;
          background:
            linear-gradient(
              145deg,
              rgba(247, 246, 255, 0.98),
              rgba(225, 242, 255, 0.98)
            );
        }

        .not-found-orbit {
          position: absolute;
          border: 1px solid rgba(46, 111, 234, 0.14);
          border-radius: 50%;
        }

        .not-found-orbit-large {
          width: 390px;
          height: 390px;
        }

        .not-found-orbit-small {
          width: 275px;
          height: 275px;
        }

        .not-found-number {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          color: #0c1734;
          font-size: clamp(5.2rem, 9vw, 9rem);
          font-weight: 900;
          letter-spacing: -0.09em;
        }

        .not-found-compass {
          position: relative;
          width: clamp(100px, 11vw, 150px);
          aspect-ratio: 1;
          border: 18px solid rgba(46, 111, 234, 0.16);
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.84);
          box-shadow: inset 0 0 0 1px rgba(46, 111, 234, 0.14);
        }

        .not-found-compass-point {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 20%;
          height: 42%;
          border-radius: 999px;
          background: #2e6fea;
          transform: translate(-50%, -68%) rotate(35deg);
          transform-origin: 50% 90%;
        }

        .not-found-compass-centre {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 18px;
          height: 18px;
          border: 5px solid #ffffff;
          border-radius: 50%;
          background: #0d2e67;
          box-shadow: 0 0 0 4px rgba(46, 111, 234, 0.18);
          transform: translate(-50%, -50%);
        }

        .not-found-support {
          padding: 32px 42px;
          display: grid;
          grid-template-columns: minmax(260px, 0.8fr) minmax(0, 1.2fr);
          align-items: center;
          gap: 34px;
          border-top: 1px solid rgba(28, 53, 96, 0.1);
          background: #fbfcff;
        }

        .not-found-support-label {
          display: block;
          margin-bottom: 8px;
          color: #101d3a;
          font-size: 1rem;
          font-weight: 800;
        }

        .not-found-support p {
          margin: 0;
          color: #6c778c;
          line-height: 1.6;
        }

        .not-found-links {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .not-found-links a {
          padding: 16px 18px;
          border: 1px solid rgba(28, 53, 96, 0.12);
          border-radius: 13px;
          background: #ffffff;
          color: #172747;
          font-weight: 750;
          text-decoration: none;
          transition:
            border-color 160ms ease,
            background-color 160ms ease,
            transform 160ms ease;
        }

        .not-found-links a:hover {
          border-color: rgba(46, 111, 234, 0.3);
          background: #f5f9ff;
          transform: translateY(-1px);
        }

        @media (max-width: 980px) {
          .not-found-page {
            padding: 18px;
          }

          .not-found-content {
            padding: 54px 36px;
            grid-template-columns: 1fr;
            gap: 40px;
          }

          .not-found-copy {
            max-width: none;
          }

          .not-found-visual {
            min-height: 390px;
          }

          .not-found-support {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .not-found-page {
            padding: 0;
            align-items: stretch;
          }

          .not-found-shell {
            min-height: 100vh;
            border: 0;
            border-radius: 0;
          }

          .not-found-topbar {
            padding: 22px 20px;
            align-items: flex-start;
            flex-direction: column;
            gap: 8px;
          }

          .not-found-content {
            min-height: auto;
            padding: 44px 20px;
          }

          .not-found-copy h1 {
            font-size: clamp(3rem, 17vw, 4.4rem);
          }

          .not-found-description {
            margin-top: 24px;
            font-size: 1.02rem;
          }

          .not-found-path {
            width: 100%;
            align-items: flex-start;
            flex-direction: column;
          }

          .not-found-path code {
            width: 100%;
          }

          .not-found-actions {
            flex-direction: column;
          }

          .not-found-primary-button,
          .not-found-secondary-button {
            width: 100%;
          }

          .not-found-visual {
            min-height: 300px;
          }

          .not-found-number {
            gap: 10px;
          }

          .not-found-compass {
            border-width: 12px;
          }

          .not-found-support {
            padding: 28px 20px;
          }

          .not-found-links {
            grid-template-columns: 1fr;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .not-found-page *,
          .not-found-page *::before,
          .not-found-page *::after {
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

export default NotFound;