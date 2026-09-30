import type { CourseContentResponseDto, CourseEnrollmentsResponseDto } from "@/backend/model"
import { getCourseUsersContentInfo } from "@/backend/services/course-content"
import { getCourseUsersEnrollmentsInfo } from "@/backend/services/course-enrollments"
import { syncUserEnrollments } from "@/backend/services/user-enrollments"
import { appStore } from "@/lib/appStore.svelte"
import { dedupeBy } from "@/lib/utils"

export async function syncCourses() {
  const enrollmentsResponse = await syncUserEnrollments()

  appStore.courseItems = enrollmentsResponse.courses.map((course) => ({
    id: course.id,
    name: course.fullName,
    startDate: course.startDate,
    endDate: course.endDate,
  }))
}

export function setCourse(courseId: number) {
  const course = appStore.courseItems.find((course) => course.id === courseId)

  if (!course) return

  appStore.currentCourseId = course.id

  if (course.startDate) {
    appStore.from = course.startDate.slice(0, 16)
  } else {
    // Default to 6 months ago if no start date is available
    appStore.from = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16)
  }

  if (course.endDate) {
    appStore.to = course.endDate.slice(0, 16)
  } else {
    // Default to current date if no end date is available
    appStore.to = new Date().toISOString().slice(0, 16)
  }

  update(getCourseUsersEnrollmentsInfo(courseId), getCourseUsersContentInfo(courseId))
}

export function update(
  enrollmentsResponse: Promise<CourseEnrollmentsResponseDto>,
  contentResponse: Promise<CourseContentResponseDto>,
) {
  const usersPromise = enrollmentsResponse.then(({ users }) => {
    appStore.userItems = users.map(
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

    appStore.roleItems = dedupeBy(
      users.flatMap(({ roles }) => roles),
      (role) => role.id,
    ).map(({ id, name }) => ({ id, name, checked: false }))

    appStore.groupItems = dedupeBy(
      users.flatMap(({ groups }) => groups),
      (group) => group.id,
    ).map(({ id, name }) => ({ id, name, checked: false }))
  })

  const sectionsPromise = contentResponse.then(({ sections }) => {
    const modules = sections.flatMap(({ modules }) => modules)

    appStore.sectionItems = sections.map(({ id, name, modules }) => ({
      id,
      checked: false,
      name,
      modules: modules.map(({ id }) => id),
    }))
    appStore.moduleItems = modules.map(({ id, name, modName }) => ({
      id,
      checked: false,
      name,
      modName,
    }))
  })

  return Promise.all([usersPromise, sectionsPromise])
}
