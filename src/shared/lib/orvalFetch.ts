import { loginStore } from "@/features/auth/login.svelte"
import { resolveApiUrl } from "@/shared/api/config"
import type { ErrorResponse } from "@/shared/api/model"

export class BackendError extends Error {
  constructor(code: string) {
    super(code)
  }
}

export async function orvalFetch<T>(url: string, options: RequestInit = {}) {
  const token = loginStore.token

  const response = await fetch(resolveApiUrl(url), {
    ...options,
    headers: {
      ...options.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!response.ok) {
    const error: ErrorResponse = await response.json()
    throw new BackendError(error.code)
  }

  return response.status === 204 ? (null as T) : ((await response.json()) as T)
}
