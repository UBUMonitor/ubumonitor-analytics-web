import { m } from "@/paraglide/messages"
import { BackendError } from "@/utils/orvalFetch"

export class AppError extends Error {
  constructor(code: string) {
    super(code)
  }
}

export function getErrorMessage(error: unknown) {
  if (error instanceof BackendError) {
    if (error.message === "INTERNAL_SERVER_ERROR") return m.application_error()
    if (error.message === "UNAUTHORIZED") return m.login_unauthorized_error()
    if (error.message === "INVALID_DATABASE_ENCRYPTION_KEY") return m.database_password_error()
  }

  if (error instanceof AppError) {
    if (error.message === "MOODLE_INVALID") return m.host_invalid_error()
    if (error.message === "MOODLE_UNSUPPORTED") return m.host_unsupported_error()
  }

  if (error instanceof Error) {
    return error.message
  }
  return "Unknown error"
}
