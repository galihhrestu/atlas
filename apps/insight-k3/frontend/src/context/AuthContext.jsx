import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { apiRequest } from "../services/apiClient";
import {
  loginRequest,
  logoutRequest,
  refreshSessionRequest
} from "../services/authService";
import {
  getLegacyRole,
  normalizeAuthUser
} from "../utils/auth";

const AuthContext = createContext(null);

const LEGACY_USER_KEY = "user";
const LEGACY_ROLE_KEY = "userRole";
const SESSION_HINT_KEY = "insightK3Session";

let bootstrapSessionPromise = null;

function hasSessionHint() {
  return (
    localStorage.getItem(SESSION_HINT_KEY) === "1" ||
    Boolean(localStorage.getItem(LEGACY_USER_KEY))
  );
}

function requestBootstrapSession() {
  if (!bootstrapSessionPromise) {
    bootstrapSessionPromise = refreshSessionRequest().catch((error) => {
      if (error.status === 401) {
        return null;
      }

      throw error;
    });
  }

  return bootstrapSessionPromise;
}

function persistLegacyCompatibilityUser(user) {
  if (!user) {
    localStorage.removeItem(LEGACY_USER_KEY);
    localStorage.removeItem(LEGACY_ROLE_KEY);
    localStorage.removeItem(SESSION_HINT_KEY);
    return;
  }

  const legacyRole = getLegacyRole(user.role);
  const legacyUser = {
    ...user,
    role: legacyRole,
    authRole: user.role
  };

  localStorage.setItem(
    LEGACY_USER_KEY,
    JSON.stringify(legacyUser)
  );
  localStorage.setItem(LEGACY_ROLE_KEY, legacyRole);
  localStorage.setItem(SESSION_HINT_KEY, "1");
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [sessionError, setSessionError] = useState("");
  const refreshPromiseRef = useRef(null);

  const applySession = useCallback((sessionData) => {
    const normalizedUser = normalizeAuthUser(sessionData?.user);
    const nextAccessToken = sessionData?.accessToken || null;

    setUser(normalizedUser);
    setAccessToken(nextAccessToken);
    setSessionError("");
    persistLegacyCompatibilityUser(normalizedUser);

    return {
      user: normalizedUser,
      accessToken: nextAccessToken
    };
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    persistLegacyCompatibilityUser(null);
  }, []);

  useEffect(() => {
    let active = true;

    async function bootstrapAuthentication() {
      if (!hasSessionHint()) {
        clearSession();
        setInitializing(false);
        return;
      }

      try {
        const response = await requestBootstrapSession();

        if (!active) {
          return;
        }

        if (response?.data) {
          applySession(response.data);
        } else {
          clearSession();
        }
      } catch (error) {
        if (!active) {
          return;
        }

        clearSession();
        setSessionError(error.message);
      } finally {
        if (active) {
          setInitializing(false);
        }
      }
    }

    bootstrapAuthentication();

    return () => {
      active = false;
    };
  }, [applySession, clearSession]);

  const login = useCallback(
    async ({ identifier, password }) => {
      const response = await loginRequest({
        identifier: identifier.trim(),
        password
      });

      bootstrapSessionPromise = null;
      return applySession(response.data);
    },
    [applySession]
  );

  const refreshSession = useCallback(async () => {
    if (!refreshPromiseRef.current) {
      refreshPromiseRef.current = refreshSessionRequest()
        .then((response) => applySession(response.data))
        .catch((error) => {
          clearSession();
          throw error;
        })
        .finally(() => {
          refreshPromiseRef.current = null;
        });
    }

    return refreshPromiseRef.current;
  }, [applySession, clearSession]);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch (error) {
      // Sesi lokal tetap harus dibersihkan meskipun jaringan/server bermasalah.
      console.warn("Logout backend tidak dapat dikonfirmasi:", error.message);
    } finally {
      bootstrapSessionPromise = null;
      clearSession();
    }
  }, [clearSession]);

  const authFetch = useCallback(
    async (path, options = {}) => {
      const {
        retryOnUnauthorized = true,
        ...requestOptions
      } = options;

      const executeRequest = (token) =>
        apiRequest(path, {
          ...requestOptions,
          headers: {
            ...requestOptions.headers,
            Authorization: `Bearer ${token}`
          }
        });

      let token = accessToken;

      if (!token) {
        const refreshedSession = await refreshSession();
        token = refreshedSession.accessToken;
      }

      try {
        return await executeRequest(token);
      } catch (error) {
        if (error.status !== 401 || !retryOnUnauthorized) {
          throw error;
        }

        const refreshedSession = await refreshSession();
        return executeRequest(refreshedSession.accessToken);
      }
    },
    [accessToken, refreshSession]
  );

  const value = useMemo(
    () => ({
      user,
      accessToken,
      authenticated: Boolean(user && accessToken),
      initializing,
      sessionError,
      login,
      logout,
      refreshSession,
      authFetch
    }),
    [
      user,
      accessToken,
      initializing,
      sessionError,
      login,
      logout,
      refreshSession,
      authFetch
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider.");
  }

  return context;
}
