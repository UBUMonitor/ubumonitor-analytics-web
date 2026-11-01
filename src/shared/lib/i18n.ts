import { m } from "@/shared/paraglide/messages"
import { getLocale } from "@/shared/paraglide/runtime"
import type { SelectableItem } from "@/shared/types/selectable-item"

export function translateCode(code: string): string {
  const message = Object.getOwnPropertyDescriptor(m, code)?.value
  return typeof message === "function" ? message() : code
}

export function mapAndSort(items: readonly { id: number; code: string }[]): SelectableItem[] {
  return items
    .map(({ id, code }) => ({ id, name: translateCode(code), checked: false }))
    .sort((a, b) => a.name.localeCompare(b.name, getLocale()))
}
