import type { RecordType } from "@/features/records/record.svelte"
import type { UserItem } from "@/features/users/user.svelte"
import type { CourseLogsInfoRequestFiltersDto } from "@/shared/api/model"
import type { SelectableItem } from "@/shared/types/selectable-item"

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
