import { BackendError } from "../lib/orvalFetch"
import { m } from "@/shared/paraglide/messages"

export function getErrorMessage(error: unknown) {
  if (error instanceof BackendError) {
    if (error.message === "MOODLE_UNAUTHORIZED") return m.login_unautorized_error()
    if (error.message === "INVALID_DATABASE_ENCRYPTION_KEY") return m.login_database_error()
  }

  if (error instanceof Error) {
    return error.message
  }
  return "Unknown error"
}
