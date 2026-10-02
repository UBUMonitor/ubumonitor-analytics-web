import type { CourseContentResponseDto, CourseEnrollmentsResponseDto } from "@/backend/model"
import { dashboardStore } from "@/dashboard/dashboard.svelte"
import { dedupeBy } from "@/shared/lib/utils"

export function updateDashboard(
  enrollmentsResponse: Promise<CourseEnrollmentsResponseDto>,
  contentResponse: Promise<CourseContentResponseDto>,
) {
  const usersPromise = enrollmentsResponse.then(({ users }) => {
    dashboardStore.userItems = users.map(
      ({ id, imageUrl, fullName, lastAccess, lastCourseAccess, roles, groups }) => ({
        id,
        checked: false,
        name: fullName,
        imageUrl,
        lastAccess,
        lastCourseAccess,
        roles: roles.map(({ id }) => id),
        groups: groups.map(({ id }) => id),
        show: true,
      }),
    )

    dashboardStore.roleItems = dedupeBy(
      users.flatMap(({ roles }) => roles),
      (role) => role.id,
    ).map(({ id, name }) => ({ id, name, checked: false }))

    dashboardStore.groupItems = dedupeBy(
      users.flatMap(({ groups }) => groups),
      (group) => group.id,
    ).map(({ id, name }) => ({ id, name, checked: false }))
  })

  const sectionsPromise = contentResponse.then(({ sections }) => {
    const modules = sections.flatMap(({ modules }) => modules)

    dashboardStore.sectionItems = sections.map(({ id, name, modules }) => ({
      id,
      checked: false,
      name,
      modules: modules.map(({ id }) => id),
    }))
    dashboardStore.moduleItems = modules.map(({ id, name, modName }) => ({
      id,
      checked: false,
      name,
      modName,
    }))
  })

  return Promise.all([usersPromise, sectionsPromise])
}
