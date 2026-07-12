import type { CourseLogsMetricsRequestDtoInterval } from "@/model"

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

export type Info = "section" | "module"

export const appStore = $state({
  userItems: [] as UserItem[],
  sectionItems: [] as SectionItem[],
  moduleItems: [] as ModuleItem[],
  roleItems: [] as Item[],
  groupItems: [] as Item[],
  from: "2023-01-01T02:00",
  to: "2023-12-31T23:59:59",
  group: "MONTHLY" as CourseLogsMetricsRequestDtoInterval,
  scale: 60,
  selectedInfo: "section" as Info,
})

export function clearAppStore() {
  appStore.userItems = []
  appStore.sectionItems = []
  appStore.moduleItems = []
  appStore.roleItems = []
  appStore.groupItems = []
}

const _filteredUsers = $derived.by(() => {
  const selectedRoles = new Set(
    appStore.roleItems.filter(({ checked }) => checked).map(({ id }) => id),
  )
  const selectedGroups = new Set(
    appStore.groupItems.filter(({ checked }) => checked).map(({ id }) => id),
  )

  if (selectedRoles.size === 0 && selectedGroups.size === 0) {
    return appStore.userItems
  }

  return appStore.userItems.filter((user) => {
    const matchesRole = selectedRoles.size === 0 || user.roles.some((r) => selectedRoles.has(r))
    const matchesGroup = selectedGroups.size === 0 || user.groups.some((g) => selectedGroups.has(g))
    return matchesRole && matchesGroup
  })
})

const _selectedUsers = $derived(_filteredUsers.filter(({ checked }) => checked))

export function getFilteredUsers() {
  return _filteredUsers
}

export function getSelectedUsers() {
  return _selectedUsers
}
