let apiBaseUrl = import.meta.env.VITE_API_BASE_URL

export function resolveApiUrl(url: string): URL {
  if (!apiBaseUrl) throw new Error("The backend URL has not been configured.")
  return new URL(url, `${apiBaseUrl.replace(/\/$/, "")}/`)
}

export function setApiBaseUrl(url: string) {
  apiBaseUrl = url
}
