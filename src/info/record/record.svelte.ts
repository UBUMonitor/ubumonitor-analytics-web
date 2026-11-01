import type { CourseContentResponseDto, CourseLogsResponseDto } from "@/backend/model"
import { mapAndSort, translateCode } from "@/shared/lib/i18n"
import type { Item, SelectableItem } from "@/shared/types/selectable-item"

export interface ModuleItem extends SelectableItem {
  sectionId: number
  modName?: string
}

export type RecordType = "component" | "event" | "section" | "module"

class RecordStore {
  sectionItems = $state<SelectableItem[]>([])
  moduleItems = $state<ModuleItem[]>([])
  componentItems = $state<SelectableItem[]>([])
  eventItems = $state<SelectableItem[]>([])
  originItems = $state<Item[]>([])

  reset() {
    this.sectionItems = []
    this.moduleItems = []
    this.componentItems = []
    this.eventItems = []
    this.originItems = []
  }

  async updateRecords(
    content: Promise<CourseContentResponseDto>,
    logs: Promise<CourseLogsResponseDto>,
  ) {
    const [{ sections }, { column }] = await Promise.all([content, logs])
    const checkedIds = (items: readonly SelectableItem[]) =>
      new Set(items.filter(({ checked }) => checked).map(({ id }) => id))
    const checkedSections = checkedIds(this.sectionItems)
    const checkedModules = checkedIds(this.moduleItems)
    const checkedComponents = checkedIds(this.componentItems)
    const checkedEvents = checkedIds(this.eventItems)

    const sectionItems = sections.map(({ id, name }) => ({
      id,
      checked: checkedSections.has(id),
      name,
    }))
    const moduleItems = sections
      .flatMap(({ modules, id: sectionId }) => modules.map((module) => ({ ...module, sectionId })))
      .map(({ id, name, modName, sectionId }) => ({
        id,
        checked: checkedModules.has(id),
        name,
        modName,
        sectionId,
      }))
    const componentItems = mapAndSort(column.components).map((item) => ({
      ...item,
      checked: checkedComponents.has(item.id),
    }))
    const eventItems = mapAndSort(column.events).map((item) => ({
      ...item,
      checked: checkedEvents.has(item.id),
    }))
    const originItems = column.origins.map(({ id, code }) => ({
      id,
      name: translateCode(code),
    }))

    this.sectionItems = sectionItems
    this.moduleItems = moduleItems
    this.componentItems = componentItems
    this.eventItems = eventItems
    this.originItems = originItems
  }
}

export const recordStore = new RecordStore()
