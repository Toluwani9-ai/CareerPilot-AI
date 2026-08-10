import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiArrowRight,
  FiLock,
  FiMail,
  FiUser,
} from "react-icons/fi";

const initialFormData = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

// Registration page
function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialFormData);
  const [error, setError] = useState("");

  // update form input
  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }

  // handle submission
  function handleSubmit(event) {
    event.preventDefault();

    const fullName = formData.fullName.trim();
    const email = formData.email.trim();

    if (
      !fullName ||
      !email ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please complete every field.");
      return;
    }

    // Validate full name
    if (fullName.length < 2) {
      setError("Please enter your full name.");
      return;
    }

    if (formData.password.length < 8) {
      setError("Your password must contain at least 8 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    // navigate to login page
    navigate("/login", {
      replace: true,
      state: {
        registrationMessage:
          "Your account details were accepted. You can now sign in.",
      },
    });
  }

  return (
    <main className="auth-page">
      <section className="auth-panel auth-introduction">
        <Link className="brand-link" to="/">
          CareerPilot AI
        </Link>

        <div className="auth-introduction-content">
          <span className="eyebrow">Create your account</span>

          <h1>Turn your experience into a practical career plan.</h1>

          <p>
            Create an account to analyse your CV, compare your skills with job
            requirements and track your development over time.
          </p>

          /* Feature list */
          <div className="auth-feature-list">
            <article>
              <strong>Analyse your CV</strong>
              <span>
                Identify recognised skills and areas of professional strength.
              </span>
            </article>

            <article>
              <strong>Compare job opportunities</strong>
              <span>
                Understand which requirements you already meet and what is
                missing.
              </span>
            </article>

            <article>
              <strong>Build a learning roadmap</strong>
              <span>
                Receive focused recommendations based on your career goals.
              </span>
            </article>
          </div>
        </div>
      </section>

      /* Registration form */
      <section className="auth-panel auth-form-section">
        <div className="auth-form-wrapper">
          <header className="auth-heading">
            <span className="eyebrow">New account</span>
            <h2>Register</h2>
            <p>Enter your details to create a CareerPilot AI account.</p>
          </header>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <label htmlFor="fullName">
              Full name

              <span className="input-wrapper">
                <FiUser aria-hidden="true" />

                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </span>
            </label>

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
                  autoComplete="new-password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </span>
            </label>

            <label htmlFor="confirmPassword">
              Confirm password

              <span className="input-wrapper">
                <FiLock aria-hidden="true" />

                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Enter the password again"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </span>
            </label>

            {error && (
              <p className="form-message form-message-error" role="alert">
                {error}
              </p>
            )}
            
            /* Register button */
            <button
              className="primary-button full-width-button"
              type="submit"
            >
              Create account
              <FiArrowRight aria-hidden="true" />
            </button>
          </form>

          <p className="auth-switch-text">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}

export default Register;