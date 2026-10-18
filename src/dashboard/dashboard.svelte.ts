import {
  includeIntl,
  isDateRangeBetween,
  isDateRangeLess,
  isDateRangeMore,
} from "@/shared/lib/utils"
import { m } from "@/shared/paraglide/messages"

export interface Item {
  id: number
  name: string
  checked: boolean
}

export interface UserItem extends Item {
  imageUrl?: string
  lastAccess?: string
  lastCourseAccess?: string
  roles: number[]
  groups: number[]
}

export interface SectionItem extends Item {
  modules: number[]
}

export interface ModuleItem extends Item {
  modName?: string
}

export interface LastAccessItem extends Item {
  is: (lastCourseAccess?: string) => boolean
}

export const LAST_ACCESS_INTERVALS: Array<LastAccessItem> = $state([
  {
    id: 0,
    name: m.date_range_last_label({ days: 2 }),
    checked: false,
    is: (lastCourseAccess) => !!lastCourseAccess && isDateRangeLess(lastCourseAccess, 2),
  },
  {
    id: 1,
    name: m.date_range_between_label({
      minDays: 3,
      maxDays: 6,
    }),
    checked: false,
    is: (lastCourseAccess) => !!lastCourseAccess && isDateRangeBetween(lastCourseAccess, 3, 6),
  },
  {
    id: 2,
    name: m.date_range_between_label({
      minDays: 7,
      maxDays: 12,
    }),
    checked: false,
    is: (lastCourseAccess) => !!lastCourseAccess && isDateRangeBetween(lastCourseAccess, 7, 12),
  },
  {
    id: 3,
    name: m.date_range_over_label({
      days: 13,
    }),
    checked: false,
    is: (lastCourseAccess) => !lastCourseAccess || isDateRangeMore(lastCourseAccess, 13),
  },
])

export type Info = "component" | "event" | "section" | "module"

export const dashboardStore = $state({
  userItems: [] as UserItem[],
  roleItems: [] as Item[],
  groupItems: [] as Item[],
  nameFilter: "",
  sectionItems: [] as SectionItem[],
  moduleItems: [] as ModuleItem[],
  componentItems: [] as Item[],
  eventItems: [] as Item[],
  selectedInfo: "component" as Info,
})

const _filteredUsers = $derived.by(() => {
  const selectedRoles = new Set(
    dashboardStore.roleItems.filter(({ checked }) => checked).map(({ id }) => id),
  )
  const selectedGroups = new Set(
    dashboardStore.groupItems.filter(({ checked }) => checked).map(({ id }) => id),
  )

  const selectedLastCourseAccess = LAST_ACCESS_INTERVALS.filter(({ checked }) => checked)

  if (
    selectedRoles.size === 0 &&
    selectedGroups.size === 0 &&
    selectedLastCourseAccess.length === 0 &&
    dashboardStore.nameFilter === ""
  ) {
    return dashboardStore.userItems
  }

  return dashboardStore.userItems.filter((user) => {
    const matchesRole = selectedRoles.size === 0 || user.roles.some((r) => selectedRoles.has(r))
    const matchesGroup = selectedGroups.size === 0 || user.groups.some((g) => selectedGroups.has(g))
    const matchesLastAccess =
      selectedLastCourseAccess.length === 0 ||
      selectedLastCourseAccess.some((s) => s.is(user.lastCourseAccess))
    const matchesName = includeIntl(user.name, dashboardStore.nameFilter)

    return matchesRole && matchesGroup && matchesLastAccess && matchesName
  })
})

const _selectedUsers = $derived(_filteredUsers.filter(({ checked }) => checked))

export function getFilteredUsers() {
  return _filteredUsers
}

export function getSelectedUsers() {
  return _selectedUsers
}

export function clear() {
  dashboardStore.userItems = []
  dashboardStore.sectionItems = []
  dashboardStore.moduleItems = []
  dashboardStore.componentItems = []
  dashboardStore.eventItems = []
  dashboardStore.roleItems = []
  dashboardStore.groupItems = []
}
