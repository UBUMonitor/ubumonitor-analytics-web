import { getToken } from "@/lib/sessionStore.svelte"

export const orvalFetch = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const token = getToken()

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
    data: await response.json(),
    status: response.status,
    headers: response.headers,
  } as T
}
