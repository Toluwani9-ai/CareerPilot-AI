import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight, FiLock, FiMail } from "react-icons/fi";

// Login page
function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setError("");

    // Validate input
    if (!formData.email.trim() || !formData.password.trim()) {
      setError("Please enter both your email address and password.");
      return;
    }

    // Create login session
    const authenticatedUser = {
      email: formData.email.trim(),
      isAuthenticated: true,
    };

    // Save login details
    try {
      localStorage.setItem("careerPilotAuthToken", "authenticated");
      localStorage.setItem(
        "careerPilotUser",
        JSON.stringify(authenticatedUser),
      );
    } catch {
      setError(
        "Your browser could not save the login session. Please enable local storage and try again.",
      );
      return;
    }

    navigate("/dashboard", { replace: true });
  }

  return (
    <main className="auth-page">
      <section className="auth-panel auth-introduction">
        <Link className="brand-link" to="/">
          CareerPilot AI
        </Link>
         {/* Welcome back*/}
        <div className="auth-introduction-content">
          <span className="eyebrow">Welcome back</span>

          <h1>Continue building your career pathway.</h1>

          <p>
            Sign in to review your CV analysis, compare job requirements and
            continue your personalised learning roadmap.
          </p>

          <div className="auth-feature-list">
            <article>
              <strong>Understand your strengths</strong>
              <span>Review the skills identified from your uploaded CV.</span>
            </article>

            <article>
              <strong>Compare career opportunities</strong>
              <span>Measure your skills against relevant job descriptions.</span>
            </article>

            <article>
              <strong>Plan your development</strong>
              <span>Follow practical recommendations for missing skills.</span>
            </article>
          </div>
        </div>
      </section>

      {/* Sign in form */}
      <section className="auth-panel auth-form-section">
        <div className="auth-form-wrapper">
          <header className="auth-heading">
            <span className="eyebrow">Account access</span>
            <h2>Sign in</h2>
            <p>Enter your account details to open your dashboard.</p>
          </header>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="email">
              Email address

              <span className="input-wrapper">
                <FiMail aria-hidden="true" />

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="student@example.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </span>
            </label>

            
            <label htmlFor="password">
              Password

              <span className="input-wrapper">
                <FiLock aria-hidden="true" />

                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </span>
            </label>

            {error && (
              <p className="form-message form-message-error" role="alert">
                {error}
              </p>
            )}

            <button
              className="primary-button full-width-button"
              type="submit"
            >
              Sign in
              <FiArrowRight aria-hidden="true" />
            </button>
          </form>
         
          
          <p className="auth-switch-text">
            Do not have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default Login;