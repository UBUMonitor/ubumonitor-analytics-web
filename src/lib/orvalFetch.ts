import { fetch } from "@tauri-apps/plugin-http"
import { appStore } from "./appStore.svelte"

export const orvalFetch = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const token = appStore.token

  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return {
    data: response.status === 204 ? null : await response.json(),
    status: response.status,
    headers: response.headers,
  } as T
}
