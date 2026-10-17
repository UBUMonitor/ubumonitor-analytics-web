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

export type Info = "component" | "event" | "section" | "module"

export const dashboardStore = $state({
  userItems: [] as UserItem[],
  sectionItems: [] as SectionItem[],
  moduleItems: [] as ModuleItem[],
  componentItems: [] as Item[],
  eventItems: [] as Item[],
  roleItems: [] as Item[],
  groupItems: [] as Item[],
  selectedInfo: "component" as Info,
})

const _filteredUsers = $derived.by(() => {
  const selectedRoles = new Set(
    dashboardStore.roleItems.filter(({ checked }) => checked).map(({ id }) => id),
  )
  const selectedGroups = new Set(
    dashboardStore.groupItems.filter(({ checked }) => checked).map(({ id }) => id),
  )

  if (selectedRoles.size === 0 && selectedGroups.size === 0) {
    return dashboardStore.userItems
  }

  return dashboardStore.userItems.filter((user) => {
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

export function clear() {
  dashboardStore.userItems = []
  dashboardStore.sectionItems = []
  dashboardStore.moduleItems = []
  dashboardStore.componentItems = []
  dashboardStore.eventItems = []
  dashboardStore.roleItems = []
  dashboardStore.groupItems = []
}
