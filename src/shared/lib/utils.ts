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

export function includeIntl(text: string, search: string) {
  if (!search) return true

  const collator = new Intl.Collator(getLocale(), {
    usage: "search",
    sensitivity: "base",
  })

  for (let i = 0; i <= text.length - search.length; i++) {
    if (collator.compare(text.slice(i, i + search.length), search) === 0) {
      return true
    }
  }

  return false
}
