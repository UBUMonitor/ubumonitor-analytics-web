import { authLogin, type authLoginResponseSuccess } from "@/services/auth/auth"
import { syncSiteInfo, type syncSiteInfoResponseSuccess } from "@/services/sites/sites"
import {
  syncUserEnrollments,
  type syncUserEnrollmentsResponseSuccess,
} from "@/services/user-enrollments/user-enrollments"
import { appStore } from "@/lib/appStore.svelte"
import { getCourseUsersEnrollmentsInfo } from "@/services/course-enrollments/course-enrollments"
import type {
  CourseContentResponseDto,
  CourseContentSectionDto,
  CourseEnrollmentsResponseDto,
  UserEnrollmentInfoDto,
} from "@/model"
import { dedupeBy } from "./utils"
import { getCourseUsersContentInfo } from "@/services/course-content/course-content"

export async function login(username: string, password: string, dbPassword: string, host: string) {
  const loginResponse = (await authLogin({
    username,
    password,
    dbPassword,
    host,
  })) as authLoginResponseSuccess

  appStore.token = loginResponse.data.accessToken

  const siteInfoResponse = (await syncSiteInfo()) as syncSiteInfoResponseSuccess

  appStore.userId = siteInfoResponse.data.user.id
}

export async function syncCourses() {
  const enrollmentsResponse = (await syncUserEnrollments()) as syncUserEnrollmentsResponseSuccess

  appStore.courseItems = enrollmentsResponse.data.courses.map((course) => ({
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

  appStore.from =
    course?.startDate?.slice(0, 16) ??
    ((d) => (d.setMonth(d.getMonth() - 6), d))(new Date()).toISOString().slice(0, 16)
  appStore.to = course?.endDate?.slice(0, 16) ?? new Date().toISOString().slice(0, 16)

  update(
    getCourseUsersEnrollmentsInfo(courseId).then(
      ({ data }) => (data as CourseEnrollmentsResponseDto).users,
    ),
    getCourseUsersContentInfo(courseId).then(
      ({ data }) => (data as CourseContentResponseDto).sections,
    ),
  )
}

export function update(
  users: Promise<UserEnrollmentInfoDto[]>,
  sections: Promise<CourseContentSectionDto[]>,
) {
  const usersPromise = users.then((users) => {
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

  const sectionsPromise = sections.then((sections) => {
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
