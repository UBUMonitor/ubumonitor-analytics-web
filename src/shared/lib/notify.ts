import SyncToast from "@/features/sync/components/SyncToast.svelte"
import ErrorToast from "@/shared/components/toast/ErrorToast.svelte"
import { getErrorMessage } from "@/shared/error/errorMessage"
import type { MutationCache } from "@tanstack/svelte-query"
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

export function trackSyncMutations(mutationCache: MutationCache): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined
  let dismissToast: (() => void) | undefined

  const isSyncing = () =>
    mutationCache.getAll().some((mutation) => {
      return mutation.options.meta?.sync === true && mutation.state.status === "pending"
    })

  const updateToast = () => {
    if (isSyncing()) {
      if (timer || dismissToast) return

      timer = setTimeout(() => {
        timer = undefined
        if (!isSyncing()) return

        const id = toast.custom(SyncToast, { duration: Number.POSITIVE_INFINITY })
        dismissToast = () => toast.dismiss(id)
      }, 300)
      return
    }

    if (timer) clearTimeout(timer)
    timer = undefined
    dismissToast?.()
    dismissToast = undefined
  }

  const unsubscribe = mutationCache.subscribe(updateToast)
  return () => {
    unsubscribe()
    updateToast()
  }
}
