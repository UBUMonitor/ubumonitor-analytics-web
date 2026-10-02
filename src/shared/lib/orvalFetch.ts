import { loginStore } from "@/login/login.svelte"

export const orvalFetch = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const token = loginStore.token

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

  return response.status === 204 ? (null as T) : ((await response.json()) as T)
}
