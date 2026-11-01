import ErrorToast from "@/shared/components/toast/ErrorToast.svelte"
import SyncToast from "@/shared/components/toast/SyncToast.svelte"
import { getErrorMessage } from "@/shared/error/errorMessage"
import { toast } from "svelte-sonner"

function getSafeErrorMessage(error: unknown) {
  return getErrorMessage(error)
    .replace(/\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi, "Bearer [redacted]")
    .replace(
      /((?:password|token|authorization|credential|secret|api[_-]?key)\b\s*[:=]\s*)(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,
      "$1[redacted]",
    )
}

export function notifyError(error: unknown): void {
  const message = getSafeErrorMessage(error)
  const id = `error:${message}`
  toast.custom(ErrorToast, {
    id,
    componentProps: { message, closeToast: () => toast.dismiss(id) },
    duration: 8000,
  })
}

export function notifySyncStart(): () => void {
  const id = toast.custom(SyncToast, { duration: Number.POSITIVE_INFINITY })
  return () => {
    toast.dismiss(id)
  }
}
