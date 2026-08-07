export function publicAssetPath(relativePath: string) {
  const base = import.meta.env.BASE_URL || "/";
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  return `${normalizedBase}${relativePath.replace(/^\/+/, "")}`;
}

function pathSegments(pathname: string) {
  return pathname.split("/").filter(Boolean);
}

export function getSiteBasePath() {
  const segments = pathSegments(window.location.pathname);
  const sigmaIndex = segments.lastIndexOf("sigma");

  if (sigmaIndex >= 0) {
    const prefix = segments.slice(0, sigmaIndex);
    return prefix.length ? `/${prefix.join("/")}` : "/";
  }

  const configuredBase = import.meta.env.BASE_URL || "/";
  if (configuredBase.startsWith("/") && configuredBase !== "/") {
    return configuredBase.replace(/\/$/, "") || "/";
  }

  const pathname = window.location.pathname.replace(/\/$/, "");
  return pathname && pathname !== "/" ? pathname : "/";
}

export function getSigmaBasePath() {
  const segments = pathSegments(window.location.pathname);
  const sigmaIndex = segments.lastIndexOf("sigma");
  if (sigmaIndex >= 0) return `/${segments.slice(0, sigmaIndex + 1).join("/")}`;

  const siteBase = getSiteBasePath();
  return `${siteBase === "/" ? "" : siteBase}/sigma` || "/sigma";
}

export function getSigmaPath(path = "dashboard") {
  const cleanPath = path.replace(/^\/+/, "");
  const sigmaBase = getSigmaBasePath();
  return `${sigmaBase}/${cleanPath}`;
}

export function getAtlasHomePath() {
  return getSiteBasePath();
}
