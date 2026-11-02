import { getCourseUsersContentInfo, syncCourseContent } from "@/backend/services/course-content"
import {
  getCourseUsersEnrollmentsInfo,
  syncCourseUsersEnrollments,
} from "@/backend/services/course-enrollments"
import { getCourseGradesInfo, syncCourseGrades } from "@/backend/services/course-grades"
import { getCourseLogsInfo, syncCourseLogs } from "@/backend/services/course-logs"
import { courseStore } from "@/dashboard/course.svelte"
import { updateChartDate } from "@/display/display"
import { gradeStore } from "@/info/grade/grade.svelte"
import { recordStore } from "@/info/record/record.svelte"
import { loginStore } from "@/login/login.svelte"
import { userStore } from "@/user/user.svelte"
import { DateTime } from "luxon"

export async function changeCourse(courseId: number) {
  const course = courseStore.courseItems.find((course) => course.id === courseId)

  if (!course) return

  const isDifferentCourse = courseStore.currentCourse?.id !== course.id
  courseStore.currentCourse = course

  if (isDifferentCourse) {
    resetCourseData()
  }

  updateChartDate(course.startDate, course.endDate)

  courseStore.isSyncing = true
  try {
    if (course.lastSync) {
      await updateAll(course.id, course.name)
    } else {
      try {
        if (await syncAllForCourse(course.id)) {
          course.lastSync = DateTime.now()
        } else {
          clearCourseSelection()
        }
      } catch (error) {
        clearCourseSelection()
        throw error
      }
    }
  } finally {
    courseStore.isSyncing = false
  }
}

function clearCourseSelection() {
  courseStore.currentCourse = null
  resetCourseData()
  updateChartDate()
}

export function resetCourseData() {
  userStore.reset()
  recordStore.reset()
  gradeStore.reset()
}

async function updateAll(courseId: number, courseName: string) {
  return Promise.all([
    userStore.updateUsers(getCourseUsersEnrollmentsInfo(courseId)),
    recordStore.updateRecords(getCourseUsersContentInfo(courseId), getCourseLogsInfo(courseId)),
    gradeStore.updateGrades(getCourseGradesInfo(courseId), courseName),
  ])
}

export async function syncAll(courseId: number) {
  courseStore.isSyncing = true
  try {
    if (await syncAllForCourse(courseId)) {
      const course = courseStore.courseItems.find(({ id }) => id === courseId)
      if (course) course.lastSync = DateTime.now()
    }
  } finally {
    courseStore.isSyncing = false
  }
}

async function syncAllForCourse(courseId: number) {
  const [enrollments, [content, logs], grades] = await Promise.all([
    syncCourseUsersEnrollments(courseId),
    Promise.all([syncCourseContent(courseId), syncCourseLogs(courseId)]),
    syncCourseGrades(courseId),
  ])
  if (loginStore.token === null) return false

  return Promise.all([
    userStore.updateUsers(Promise.resolve(enrollments)),
    recordStore.updateRecords(Promise.resolve(content), Promise.resolve(logs)),
    gradeStore.updateGrades(
      Promise.resolve(grades),
      courseStore.courseItems.find(({ id }) => id === courseId)?.name ?? "",
    ),
  ]).then(() => true)
}
