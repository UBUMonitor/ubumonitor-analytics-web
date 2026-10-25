import type { SelectableItem } from "@/shared/types/selectable-item"

export interface ModuleItem extends SelectableItem {
  modName?: string
}

export type RecordType = "component" | "event" | "section" | "module"

export const recordStore = $state({
  isLoading: false,
  sectionItems: [] as SelectableItem[],
  moduleItems: [] as ModuleItem[],
  componentItems: [] as SelectableItem[],
  eventItems: [] as SelectableItem[],
})

export function clearContent() {
  recordStore.sectionItems = []
  recordStore.moduleItems = []
}

export function clear() {
  clearContent()
  recordStore.componentItems = []
  recordStore.eventItems = []
}
