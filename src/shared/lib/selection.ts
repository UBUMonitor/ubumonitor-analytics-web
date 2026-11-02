import type { SelectableItem } from "@/shared/types/selectable-item"

export function setChecked<T extends SelectableItem>(items: readonly T[], checked: boolean) {
  for (const item of items) item.checked = checked
}

export function checkedIds(items: readonly SelectableItem[]): Set<number> {
  return new Set(items.filter(({ checked }) => checked).map(({ id }) => id))
}
