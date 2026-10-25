import type { CourseEnrollmentsResponseDto } from "@/backend/model"
import { dedupeBy } from "@/shared/lib/utils"
import { getLocale } from "@/shared/paraglide/runtime"
import { clearUsers, userStore } from "@/user/user.svelte"
import { DateTime } from "luxon"

export async function updateUsers(response: Promise<CourseEnrollmentsResponseDto>) {
  userStore.isLoading = true
  clearUsers()

  try {
    const comparator = Intl.Collator(getLocale()).compare

    const { users } = await response

    userStore.userItems = users
      .toSorted((x, y) => comparator(x.fullName, y.fullName))
      .map(({ id, imageUrl, fullName, lastAccess, lastCourseAccess, roles, groups }) => {
        const now = DateTime.now()
        const lastAccessDate = lastAccess ? DateTime.fromISO(lastAccess) : undefined
        const lastCourseAccessDate = lastCourseAccess
          ? DateTime.fromISO(lastCourseAccess)
          : undefined

        const lastAccessItems = userStore.lastAccessItems

        return {
          id,
          checked: false,
          show: true,
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

    userStore.roleItems = dedupeBy(
      users.flatMap(({ roles }) => roles),
      (role) => role.id,
    ).map(({ id, name }) => ({ id, name, checked: false }))

    userStore.groupItems = dedupeBy(
      users.flatMap(({ groups }) => groups),
      (group) => group.id,
    ).map(({ id, name }) => ({ id, name, checked: false }))
  } finally {
    userStore.isLoading = false
  }
}
