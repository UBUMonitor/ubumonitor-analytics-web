import { getLocale } from "@/shared/paraglide/runtime"

const collators = new Map<string, Intl.Collator>()

export function getLocaleCollator(options: Intl.CollatorOptions = {}) {
  const locale = getLocale()
  const key = `${locale}:${options.usage ?? "sort"}:${options.sensitivity ?? "variant"}`
  let collator = collators.get(key)

  if (!collator) {
    collator = new Intl.Collator(locale, options)
    collators.set(key, collator)
  }

  return collator
}

export function includeIntl(text: string, search: string) {
  if (!search) return true

  const collator = getLocaleCollator({
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
