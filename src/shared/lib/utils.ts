import { m } from "@/shared/paraglide/messages"
import { getLocale } from "@/shared/paraglide/runtime"

export function dedupeBy<T, K>(arr: T[], keyFn: (item: T) => K): T[] {
  const seen = new Set<K>()
  return arr.filter((item) => {
    const key = keyFn(item)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function formatRelativeTime(dateString?: string) {
  if (!dateString) return m.not_available_label()

  const now = new Date()
  const date = Date.parse(dateString)
  const diff = date - now.getTime() // Difference in milliseconds
  const absDiff = Math.abs(diff)

  const rtf = new Intl.RelativeTimeFormat(getLocale(), { numeric: "auto" })

  const minutes = Math.round(diff / 1000 / 60)
  const hours = Math.round(diff / 1000 / 60 / 60)
  const days = Math.round(diff / 1000 / 60 / 60 / 24)
  const weeks = Math.round(diff / 1000 / 60 / 60 / 24 / 7)
  const months = Math.round(diff / 1000 / 60 / 60 / 24 / 30)

  if (absDiff < 60_000) return m.right_now_label()
  if (absDiff < 3_600_000) return rtf.format(minutes, "minute") // < 1 hour
  if (absDiff < 86_400_000) return rtf.format(hours, "hour") // < 1 day
  if (absDiff < 7 * 86_400_000) return rtf.format(days, "day") // < 1 week
  if (absDiff < 30 * 86_400_000) return rtf.format(weeks, "week") // < 1 month
  return rtf.format(months, "month") // 1 month+
}
