import type { EnrollmentsResponseDto } from "@/backend/model"
import { getCourseUsersContentInfo, syncCourseContent } from "@/backend/services/course-content"
import {
  getCourseUsersEnrollmentsInfo,
  syncCourseUsersEnrollments,
} from "@/backend/services/course-enrollments"
import { getCourseLogsInfo, syncCourseLogs } from "@/backend/services/course-logs"
import { courseStore } from "@/dashboard/course.svelte"
import { updateChartDate } from "@/display/display"
import { updateRecords } from "@/info/record/record"
import { updateUsers } from "@/user/user"
import { DateTime } from "luxon"

export async function updateCourses(enrollments: Promise<EnrollmentsResponseDto>) {
  const { courses } = await enrollments

  courseStore.courseItems = courses.map((course) => ({
    id: course.id,
    name: course.fullName,
    startDate: course.startDate
      ? (DateTime.fromISO(course.startDate) as DateTime<true>)
      : undefined,
    endDate: course.endDate ? (DateTime.fromISO(course.endDate) as DateTime<true>) : undefined,
    lastSync: course.lastSync ? (DateTime.fromISO(course.lastSync) as DateTime<true>) : undefined,
  }))
}

export async function changeCourse(courseId: number) {
  const course = courseStore.courseItems.find((course) => course.id === courseId)

  if (!course) return

  courseStore.currentCourseId = course.id

  updateChartDate(course.startDate, course.endDate)

  if (course.lastSync) {
    updateAll()
  } else {
    await syncAll()
    course.lastSync = DateTime.now()
  }
}

async function updateAll() {
  const courseId = courseStore.currentCourseId

  return Promise.all([
    updateUsers(getCourseUsersEnrollmentsInfo(courseId)),
    updateRecords(getCourseUsersContentInfo(courseId), getCourseLogsInfo(courseId)),
  ])
}

export async function syncAll() {
  const courseId = courseStore.currentCourseId

  return Promise.all([
    updateUsers(syncCourseUsersEnrollments(courseId)),
    updateRecords(syncCourseContent(courseId), syncCourseLogs(courseId)),
  ])
}
