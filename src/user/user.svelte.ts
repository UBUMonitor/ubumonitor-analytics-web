import type { CourseEnrollmentsResponseDto } from "@/backend/model"
import { isBetweenDaysAgo, isMoreRecentThan, isOlderThan } from "@/shared/lib/datetime"
import { includeIntl } from "@/shared/lib/utils"
import { m } from "@/shared/paraglide/messages"
import { getLocale } from "@/shared/paraglide/runtime"
import type { SelectableItem } from "@/shared/types/selectable-item"
import { DateTime } from "luxon"

export interface UserItem extends SelectableItem {
  imageUrl?: string
  lastAccess?: DateTime
  lastCourseAccess?: DateTime
  roles: number[]
  groups: number[]
  lastAccessGroup: number
  lastCourseAccessGroup: number
}

export interface LastAccessItem extends SelectableItem {
  is: (now: DateTime<true>, lastCourseAccess?: DateTime) => boolean
}

const lastAccessItems: Array<LastAccessItem> = [
  {
    id: 0,
    name: m.date_range_within_days({ days: 2 }),
    checked: false,
    is: (now, lastCourseAccess) =>
      lastCourseAccess != null && isMoreRecentThan(lastCourseAccess, 2, now),
  },
  {
    id: 1,
    name: m.date_range_between_days_ago({
      minDays: 3,
      maxDays: 6,
    }),
    checked: false,
    is: (now, lastCourseAccess) =>
      lastCourseAccess != null && isBetweenDaysAgo(lastCourseAccess, 3, 6, now),
  },
  {
    id: 2,
    name: m.date_range_between_days_ago({
      minDays: 7,
      maxDays: 12,
    }),
    checked: false,
    is: (now, lastCourseAccess) =>
      lastCourseAccess != null && isBetweenDaysAgo(lastCourseAccess, 7, 12, now),
  },
  {
    id: 3,
    name: m.date_range_older_than({
      days: 13,
    }),
    checked: false,
    is: (now, lastCourseAccess) =>
      lastCourseAccess == null || isOlderThan(lastCourseAccess, 13, now),
  },
]

export const userStore = $state({
  isLoading: false,
  userItems: [] as UserItem[],
  roleItems: [] as SelectableItem[],
  groupItems: [] as SelectableItem[],
  lastAccessItems: lastAccessItems,
  nameFilter: "",
})

const _filteredUsers = $derived.by(() => {
  const selectedRoles = new Set(
    userStore.roleItems.filter(({ checked }) => checked).map(({ id }) => id),
  )
  const selectedGroups = new Set(
    userStore.groupItems.filter(({ checked }) => checked).map(({ id }) => id),
  )

  const selectedAccess = new Set(
    userStore.lastAccessItems.filter(({ checked }) => checked).map(({ id }) => id),
  )

  if (
    selectedRoles.size === 0 &&
    selectedGroups.size === 0 &&
    selectedAccess.size === 0 &&
    userStore.nameFilter === ""
  ) {
    return userStore.userItems
  }

  return userStore.userItems.filter((user) => {
    const matchesRole = selectedRoles.size === 0 || user.roles.some((r) => selectedRoles.has(r))
    const matchesGroup = selectedGroups.size === 0 || user.groups.some((g) => selectedGroups.has(g))
    const matchesLastAccess =
      selectedAccess.size === 0 || selectedAccess.has(user.lastCourseAccessGroup)

    const matchesName = includeIntl(user.name, userStore.nameFilter)

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

export function clearUsers() {
  userStore.userItems = []
  userStore.roleItems = []
  userStore.groupItems = []
  userStore.nameFilter = ""
}

export async function updateUsers(response: Promise<CourseEnrollmentsResponseDto>) {
  userStore.isLoading = true
  clearUsers()

  try {
    const comparator = Intl.Collator(getLocale()).compare

    const { users, roles, groups } = await response

    userStore.userItems = users
      .toSorted((x, y) => comparator(x.fullName, y.fullName))
      .map(({ id, imageUrl, fullName, lastAccess, lastCourseAccess, roles, groups }) => {
        const now = DateTime.now()
        const lastAccessDate = lastAccess ? DateTime.fromSeconds(lastAccess) : undefined
        const lastCourseAccessDate = lastCourseAccess
          ? DateTime.fromSeconds(lastCourseAccess)
          : undefined

        const lastAccessItems = userStore.lastAccessItems

        return {
          id,
          checked: false,
          name: fullName,
          imageUrl,
          lastAccess: lastAccessDate,
          lastCourseAccess: lastCourseAccessDate,
          roles: roles.map(({ id }) => id),
          groups: groups.map(({ id }) => id),
          lastAccessGroup: lastAccessItems.find((i) => i.is(now, lastAccessDate))!.id,
          lastCourseAccessGroup: lastAccessItems.find((i) => i.is(now, lastCourseAccessDate))!.id,
        }
      })

    userStore.roleItems =
      roles?.map(({ id, name }) => ({
        id,
        name,
        checked: false,
      })) ?? []

    userStore.groupItems =
      groups?.map(({ id, name }) => ({
        id,
        name,
        checked: false,
      })) ?? []
  } finally {
    userStore.isLoading = false
  }
}
