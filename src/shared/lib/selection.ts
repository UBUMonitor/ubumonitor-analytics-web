import type { SelectableItem } from "@/shared/types/selectable-item"

export function setChecked<T extends SelectableItem>(items: readonly T[], checked: boolean) {
  for (const item of items) item.checked = checked
}
