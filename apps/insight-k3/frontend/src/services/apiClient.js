const DEFAULT_API_BASE_URL = "http://localhost:3000/api";

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL
).replace(/\/+$/, "");

export class ApiError extends Error {
  constructor(message, status = 0, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function buildUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

async function parseResponse(response) {
  const rawBody = await response.text();

  if (!rawBody) {
    return null;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return {
      message: rawBody
    };
  }
}

export async function apiRequest(path, options = {}) {
  const {
    body,
    headers = {},
    credentials = "include",
    ...requestOptions
  } = options;

  const isFormData = body instanceof FormData;
  const requestHeaders = {
    ...(!isFormData && body !== undefined
      ? { "Content-Type": "application/json" }
      : {}),
    ...headers
  };

  let response;

  try {
    response = await fetch(buildUrl(path), {
      ...requestOptions,
      credentials,
      headers: requestHeaders,
      body:
        body === undefined
          ? undefined
          : isFormData || typeof body === "string"
            ? body
            : JSON.stringify(body)
    });
  } catch {
    throw new ApiError(
      "Tidak dapat terhubung ke server INSIGHTK3. Pastikan backend sedang berjalan.",
      0
    );
  }

  const data = await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(
      data?.detail ||
        data?.message ||
        `Permintaan gagal dengan status ${response.status}.`,
      response.status,
      data
    );
  }

  return data;
}
