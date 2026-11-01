import type { CourseLogsInfoRequestFiltersDto } from "@/backend/model"
import type { RecordType } from "@/info/record/record.svelte"
import type { SelectableItem } from "@/shared/types/selectable-item"
import type { UserItem } from "@/user/user.svelte"

export function buildLogFilters(
  selectedInfo: RecordType,
  selectedItems: SelectableItem[],
  userItems: UserItem[],
): CourseLogsInfoRequestFiltersDto {
  const selectedIds = selectedItems.map(({ id }) => id)

  return {
    userIds: userItems.map(({ id }) => id),
    moduleIds: selectedInfo === "module" ? selectedIds : undefined,
    sectionIds: selectedInfo === "section" ? selectedIds : undefined,
    componentIds: selectedInfo === "component" ? selectedIds : undefined,
    eventIds: selectedInfo === "event" ? selectedIds : undefined,
  }
}
