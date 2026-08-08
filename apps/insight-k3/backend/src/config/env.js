const requiredVariables = [
  "DATABASE_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "JWT_ACCESS_EXPIRES_IN",
  "JWT_REFRESH_EXPIRES_IN",
  "BCRYPT_ROUNDS",
  "AUTH_COOKIE_NAME",
  "AUTH_COOKIE_SECURE",
  "AUTH_COOKIE_SAME_SITE"
];

const allowedSameSiteValues = new Set(["strict", "lax", "none"]);

function parseBoolean(value, defaultValue = false) {
  if (value === undefined || value === null || value === "") {
    return defaultValue;
  }

  const normalizedValue = String(value).trim().toLowerCase();

  if (normalizedValue === "true") {
    return true;
  }

  if (normalizedValue === "false") {
    return false;
  }

  throw new Error(`Nilai boolean tidak valid: ${value}`);
}

function parseInteger(value, fallbackValue) {
  const parsedValue = Number.parseInt(String(value ?? fallbackValue), 10);

  if (!Number.isInteger(parsedValue)) {
    throw new Error(`Nilai bilangan bulat tidak valid: ${value}`);
  }

  return parsedValue;
}

export function validateEnvironment() {
  const missingVariables = requiredVariables.filter(
    (variableName) => !process.env[variableName]?.trim()
  );

  if (missingVariables.length > 0) {
    throw new Error(
      `Environment variable wajib belum tersedia: ${missingVariables.join(", ")}`
    );
  }

  if (process.env.JWT_ACCESS_SECRET.trim().length < 64) {
    throw new Error("JWT_ACCESS_SECRET minimal harus memiliki 64 karakter.");
  }

  if (process.env.JWT_REFRESH_SECRET.trim().length < 64) {
    throw new Error("JWT_REFRESH_SECRET minimal harus memiliki 64 karakter.");
  }

  if (
    process.env.JWT_ACCESS_SECRET.trim() ===
    process.env.JWT_REFRESH_SECRET.trim()
  ) {
    throw new Error(
      "JWT_ACCESS_SECRET dan JWT_REFRESH_SECRET harus berbeda."
    );
  }

  const bcryptRounds = parseInteger(process.env.BCRYPT_ROUNDS, 12);

  if (bcryptRounds < 10 || bcryptRounds > 14) {
    throw new Error("BCRYPT_ROUNDS harus berada pada rentang 10 sampai 14.");
  }

  const cookieSecure = parseBoolean(process.env.AUTH_COOKIE_SECURE, false);
  const cookieSameSite = process.env.AUTH_COOKIE_SAME_SITE
    .trim()
    .toLowerCase();

  if (!allowedSameSiteValues.has(cookieSameSite)) {
    throw new Error(
      "AUTH_COOKIE_SAME_SITE harus bernilai strict, lax, atau none."
    );
  }

  if (cookieSameSite === "none" && !cookieSecure) {
    throw new Error(
      "AUTH_COOKIE_SECURE harus true ketika AUTH_COOKIE_SAME_SITE=none."
    );
  }
}

export function getServerConfig() {
  return {
    nodeEnv: process.env.NODE_ENV || "development",
    port: Number(process.env.PORT || 3000),
    host: process.env.HOST || "0.0.0.0",
    corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173"
  };
}

export function getAuthConfig() {
  return {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    bcryptRounds: parseInteger(process.env.BCRYPT_ROUNDS, 12),
    cookieName:
      process.env.AUTH_COOKIE_NAME || "insightk3_refresh_token",
    cookieSecure: parseBoolean(process.env.AUTH_COOKIE_SECURE, false),
    cookieSameSite:
      process.env.AUTH_COOKIE_SAME_SITE?.trim().toLowerCase() || "lax"
  };
}
