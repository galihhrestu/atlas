export function sigmaAsset(path: string) {
  return `${import.meta.env.BASE_URL}sigma/${path.replace(/^\/+/, '')}`
}
