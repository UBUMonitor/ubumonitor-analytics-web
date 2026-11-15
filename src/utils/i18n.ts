import { m } from "@/paraglide/messages"
import { getLocale } from "@/paraglide/runtime"

export const sortCompare = Intl.Collator(getLocale(), {
  sensitivity: "base",
  numeric: true,
}).compare

export const searchCompare = new Intl.Collator(getLocale(), {
  usage: "search",
  sensitivity: "base",
}).compare

export function includeIntl(text: string, search: string) {
  if (!search) return true

  for (let i = 0; i <= text.length - search.length; i++) {
    if (searchCompare(text.slice(i, i + search.length), search) === 0) {
      return true
    }
  }

  return false
}

export function translateCode(code: string): string {
  const message = Object.getOwnPropertyDescriptor(m, code)?.value
  return typeof message === "function" ? message() : code
}

export const numberFormat = Intl.NumberFormat(getLocale()).format
