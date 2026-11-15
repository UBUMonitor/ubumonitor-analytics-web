import { sortCompare, translateCode } from "@/utils/i18n"

export function withChecked<T>(items?: T[]): (T & { checked: boolean })[] {
  if (!items) return []

  return items.map((item) => ({
    ...item,
    checked: false,
  }))
}

export function withTranslate<T extends { code: string }>(items?: T[]): (T & { name: string })[] {
  if (!items) return []

  return items.map((item) => ({
    ...item,
    name: translateCode(item.code),
  }))
}

export function withCheckedAndTranslate<T extends { code: string }>(
  items: T[],
): (T & { name: string; checked: boolean })[] {
  return items
    .map((item) => ({
      ...item,
      name: translateCode(item.code),
      checked: false,
    }))
    .sort((x, y) => sortCompare(x.name, y.name))
}
