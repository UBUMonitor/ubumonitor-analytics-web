import type { EnrollmentsResponseDto } from "@/backend/model"
import { getCourseUsersContentInfo, syncCourseContent } from "@/backend/services/course-content"
import {
  getCourseUsersEnrollmentsInfo,
  syncCourseUsersEnrollments,
} from "@/backend/services/course-enrollments"
import { getCourseGradesInfo, syncCourseGrades } from "@/backend/services/course-grades"
import { getCourseLogsInfo, syncCourseLogs } from "@/backend/services/course-logs"
import { courseStore } from "@/dashboard/course.svelte"
import { updateChartDate } from "@/display/display"
import { updateGrades } from "@/info/grade/grade"
import { updateRecords } from "@/info/record/record"
import { updateUsers } from "@/user/user.svelte"
import { DateTime } from "luxon"

export async function updateCourses(enrollments: Promise<EnrollmentsResponseDto>) {
  const { courses } = await enrollments

  courseStore.courseItems = courses.map((course) => ({
    id: course.id,
    name: course.fullName,
    startDate: course.startDate
      ? (DateTime.fromSeconds(course.startDate) as DateTime<true>)
      : undefined,
    endDate: course.endDate ? (DateTime.fromSeconds(course.endDate) as DateTime<true>) : undefined,
    lastSync: course.lastSync
      ? (DateTime.fromSeconds(course.lastSync) as DateTime<true>)
      : undefined,
  }))
}

export async function changeCourse(courseId: number) {
  const course = courseStore.courseItems.find((course) => course.id === courseId)

  if (!course) return

  courseStore.currentCourse = course

  updateChartDate(course.startDate, course.endDate)

  if (course.lastSync) {
    updateAll(course.id)
  } else {
    await syncAll(course.id)
    course.lastSync = DateTime.now()
  }
}

async function updateAll(courseId: number) {
  return Promise.all([
    updateUsers(getCourseUsersEnrollmentsInfo(courseId)),
    updateRecords(getCourseUsersContentInfo(courseId), getCourseLogsInfo(courseId)),
    updateGrades(getCourseGradesInfo(courseId)),
  ])
}

export async function syncAll(courseId = courseStore.currentCourse!.id) {
  return Promise.all([
    updateUsers(syncCourseUsersEnrollments(courseId)),
    updateRecords(syncCourseContent(courseId), syncCourseLogs(courseId)),
    updateGrades(syncCourseGrades(courseId)),
  ])
}
