import type { ErrorResponse } from "@/backend/model"
import { getCheckHealthUrl } from "@/backend/services/health"
import { loginStore } from "@/login/login.svelte"
import ky from "ky"

export class BackendError extends Error {
  constructor(code: string) {
    super(code)
  }
}

export async function orvalFetch<T>(url: string, options: RequestInit = {}) {
  const token = loginStore.token

  const response = await fetch(url, {
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

export function healthCheck() {
  return ky.get(getCheckHealthUrl(), {
    retry: {
      limit: 20,
      delay: () => 200,
    },
  })
}
