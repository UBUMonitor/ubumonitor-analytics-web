import type { CourseEnrollmentsResponseDto } from "@/backend/model"
import { isBetweenDaysAgo, isMoreRecentThan, isOlderThan } from "@/shared/lib/datetime"
import { getLocaleCollator, includeIntl } from "@/shared/lib/utils"
import { m } from "@/shared/paraglide/messages"
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

class UserStore {
  userItems = $state<UserItem[]>([])
  roleItems = $state<SelectableItem[]>([])
  groupItems = $state<SelectableItem[]>([])
  lastAccessItems = $state<LastAccessItem[]>([
    {
      id: 0,
      name: m.date_range_within_days({ days: 2 }),
      checked: false,
      is: (now, lastCourseAccess) =>
        lastCourseAccess != null && isMoreRecentThan(lastCourseAccess, 2, now),
    },
    {
      id: 1,
      name: m.date_range_between_days_ago({ minDays: 3, maxDays: 6 }),
      checked: false,
      is: (now, lastCourseAccess) =>
        lastCourseAccess != null && isBetweenDaysAgo(lastCourseAccess, 3, 6, now),
    },
    {
      id: 2,
      name: m.date_range_between_days_ago({ minDays: 7, maxDays: 12 }),
      checked: false,
      is: (now, lastCourseAccess) =>
        lastCourseAccess != null && isBetweenDaysAgo(lastCourseAccess, 7, 12, now),
    },
    {
      id: 3,
      name: m.date_range_older_than({ days: 13 }),
      checked: false,
      is: (now, lastCourseAccess) =>
        lastCourseAccess == null || isOlderThan(lastCourseAccess, 13, now),
    },
  ])
  nameFilter = $state("")
  filtered = $derived.by(() => {
    const selectedRoles = new Set(
      this.roleItems.filter(({ checked }) => checked).map(({ id }) => id),
    )
    const selectedGroups = new Set(
      this.groupItems.filter(({ checked }) => checked).map(({ id }) => id),
    )
    const selectedAccess = new Set(
      this.lastAccessItems.filter(({ checked }) => checked).map(({ id }) => id),
    )

    if (
      selectedRoles.size === 0 &&
      selectedGroups.size === 0 &&
      selectedAccess.size === 0 &&
      this.nameFilter === ""
    ) {
      return this.userItems
    }

    return this.userItems.filter((user) => {
      const matchesRole = selectedRoles.size === 0 || user.roles.some((r) => selectedRoles.has(r))
      const matchesGroup =
        selectedGroups.size === 0 || user.groups.some((g) => selectedGroups.has(g))
      const matchesLastAccess =
        selectedAccess.size === 0 || selectedAccess.has(user.lastCourseAccessGroup)
      const matchesName = includeIntl(user.name, this.nameFilter)

      return matchesRole && matchesGroup && matchesLastAccess && matchesName
    })
  })
  selected = $derived(this.filtered.filter(({ checked }) => checked))

  reset() {
    this.userItems = []
    this.roleItems = []
    this.groupItems = []
    this.lastAccessItems.forEach((item) => (item.checked = false))
    this.nameFilter = ""
  }

  async updateUsers(response: Promise<CourseEnrollmentsResponseDto>) {
    const comparator = getLocaleCollator().compare
    const { users, roles, groups } = await response
    const checkedIds = (items: readonly SelectableItem[]) =>
      new Set(items.filter(({ checked }) => checked).map(({ id }) => id))
    const checkedUsers = checkedIds(this.userItems)
    const checkedRoles = checkedIds(this.roleItems)
    const checkedGroups = checkedIds(this.groupItems)
    const userItems = users
      .toSorted((x, y) => comparator(x.fullName, y.fullName))
      .map(({ id, imageUrl, fullName, lastAccess, lastCourseAccess, roles, groups }) => {
        const now = DateTime.now()
        const lastAccessDate = lastAccess ? DateTime.fromSeconds(lastAccess) : undefined
        const lastCourseAccessDate = lastCourseAccess
          ? DateTime.fromSeconds(lastCourseAccess)
          : undefined
        const accessGroup = (date: DateTime | undefined) =>
          this.lastAccessItems.find((item) => item.is(now, date))?.id ?? 3
        const lastAccessGroup = accessGroup(lastAccessDate)
        const lastCourseAccessGroup = accessGroup(lastCourseAccessDate)

        return {
          id,
          checked: checkedUsers.has(id),
          name: fullName,
          imageUrl,
          lastAccess: lastAccessDate,
          lastCourseAccess: lastCourseAccessDate,
          roles: roles.map(({ id }) => id),
          groups: groups.map(({ id }) => id),
          lastAccessGroup,
          lastCourseAccessGroup,
        }
      })
    const roleItems =
      roles?.map(({ id, name }) => ({ id, name, checked: checkedRoles.has(id) })) ?? []
    const groupItems =
      groups?.map(({ id, name }) => ({ id, name, checked: checkedGroups.has(id) })) ?? []

    this.userItems = userItems
    this.roleItems = roleItems
    this.groupItems = groupItems
  }
}

export const userStore = new UserStore()
