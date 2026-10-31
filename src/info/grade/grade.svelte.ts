import type { SelectableItem } from "@/shared/types/selectable-item"

export const gradeStore = $state({
  isLoading: false,
  items: [] as SelectableItem[],
})

export function clear() {
  gradeStore.items = []
}
