import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getDashboardPath } from "../../utils/auth";
import "../../styles/dashboard.css";

function Login() {
  const navigate = useNavigate();
  const {
    user,
    initializing,
    login,
    sessionError
  } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!initializing && user) {
      navigate(getDashboardPath(user), { replace: true });
    }
  }, [initializing, navigate, user]);

  const handleLogin = async (event) => {
    event.preventDefault();

    if (!identifier.trim() || !password) {
      setErrorMessage("Username/email dan password wajib diisi.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      const session = await login({
        identifier,
        password
      });

      setPassword("");
      navigate(getDashboardPath(session.user), { replace: true });
    } catch (error) {
      setErrorMessage(error.message || "Login gagal.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>INSIGHT K3</h1>

        <p className="login-subtitle">
          Integrated Safety Intelligence System
        </p>

        <h2>Login</h2>

        <form onSubmit={handleLogin}>
          <input
            className="login-input"
            type="text"
            placeholder="Username atau Email"
            value={identifier}
            autoComplete="username"
            disabled={initializing || submitting}
            onChange={(event) => {
              setIdentifier(event.target.value);
              setErrorMessage("");
            }}
          />

          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={password}
            autoComplete="current-password"
            disabled={initializing || submitting}
            onChange={(event) => {
              setPassword(event.target.value);
              setErrorMessage("");
            }}
          />

          {(errorMessage || sessionError) && (
            <p
              role="alert"
              style={{
                margin: "0 0 14px",
                color: "#b42318",
                fontSize: "0.9rem",
                lineHeight: 1.4
              }}
            >
              {errorMessage || sessionError}
            </p>
          )}

          <button
            type="submit"
            className="login-button-main"
            disabled={initializing || submitting}
          >
            {initializing
              ? "MEMERIKSA SESI..."
              : submitting
                ? "MEMPROSES..."
                : "LOGIN"}
          </button>
        </form>

        <p
          style={{
            marginTop: "14px",
            fontSize: "0.82rem",
            opacity: 0.75,
            textAlign: "center"
          }}
        >
          Role dan hak akses ditentukan oleh server.
        </p>
      </div>
    </div>
  );
}

export default Login;
