import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getDashboardPath } from "../utils/auth";

const THEME_STORAGE_KEY = "insightK3Theme";

function Topbar({ toggleSidebar }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [loggingOut, setLoggingOut] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem(THEME_STORAGE_KEY) === "dark";
  });

  useEffect(() => {
    document.body.classList.toggle("dark-mode", darkMode);
    document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
    localStorage.setItem(THEME_STORAGE_KEY, darkMode ? "dark" : "light");
  }, [darkMode]);

  const handleDarkMode = () => {
    setDarkMode((currentMode) => !currentMode);
  };

  const handleLogout = async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);

    try {
      await logout();
    } finally {
      navigate("/", { replace: true });
      setLoggingOut(false);
    }
  };

  const dashboardPath = user ? getDashboardPath(user) : "/";

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="menu-button"
          onClick={toggleSidebar}
          aria-label="Open navigation menu"
        >
          ☰
        </button>

        <Link to={dashboardPath} className="system-title">
          <span>INSIGHT</span>
          <span className="system-title-k3">K3</span>
        </Link>
      </div>

      <div className="topbar-right">
        {user && (
          <div className="user-profile">
            <div className="profile-icon">👤</div>

            <div className="profile-text">
              <div className="user-role">
                {user.role.toUpperCase()}
              </div>
              <div className="username">{user.username}</div>
            </div>
          </div>
        )}

        <button
          type="button"
          className="mode-button topbar-compact-button"
          onClick={handleDarkMode}
          aria-pressed={darkMode}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          <span className="topbar-button-icon">
            {darkMode ? "☀️" : "🌙"}
          </span>
          <span className="topbar-button-label">
            {darkMode ? "Light" : "Dark"}
          </span>
        </button>

        {user ? (
          <button
            type="button"
            className="login-button topbar-compact-button"
            onClick={handleLogout}
            disabled={loggingOut}
            aria-label="Logout"
            title="Logout"
          >
            <span className="topbar-button-icon">↪</span>
            <span className="topbar-button-label">
              {loggingOut ? "Keluar..." : "Logout"}
            </span>
          </button>
        ) : (
          <Link to="/" className="login-button topbar-compact-button">
            <span className="topbar-button-icon">↪</span>
            <span className="topbar-button-label">Login</span>
          </Link>
        )}
      </div>
    </header>
  );
}

export default Topbar;
