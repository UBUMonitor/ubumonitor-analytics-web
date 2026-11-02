import { loginStore } from "@/features/auth/login.svelte"
import { courseStore } from "@/features/course/course.svelte"
import { updateChartDate } from "@/features/display/display"
import { gradeStore } from "@/features/grades/grade.svelte"
import { recordStore } from "@/features/records/record.svelte"
import { runSyncMutation } from "@/features/sync/mutations"
import { userStore } from "@/features/users/user.svelte"
import { queryClient } from "@/shared/api/queryClient"
import {
  getGetCourseUsersContentInfoQueryKey,
  getGetCourseUsersContentInfoQueryOptions,
  getSyncCourseContentMutationOptions,
} from "@/shared/api/services/course-content"
import {
  getGetCourseUsersEnrollmentsInfoQueryKey,
  getGetCourseUsersEnrollmentsInfoQueryOptions,
  getSyncCourseUsersEnrollmentsMutationOptions,
} from "@/shared/api/services/course-enrollments"
import {
  getGetCourseGradesInfoQueryKey,
  getGetCourseGradesInfoQueryOptions,
  getSyncCourseGradesMutationOptions,
} from "@/shared/api/services/course-grades"
import {
  getCourseLogsInfo,
  getSyncCourseLogsMutationOptions,
} from "@/shared/api/services/course-logs"
import { DateTime } from "luxon"

const courseLogsInfoQueryKey = (courseId: number) => ["courseLogsInfo", courseId]

export async function changeCourse(courseId: number) {
  const course = courseStore.courseItems.find((course) => course.id === courseId)

  if (!course) return

  const isDifferentCourse = courseStore.currentCourse?.id !== course.id
  courseStore.currentCourse = course

  if (isDifferentCourse) {
    resetCourseData()
  }

  updateChartDate(course.startDate, course.endDate)

  if (course.lastSync) {
    await updateAll(course.id, course.name)
    return
  }

  if (await syncAllForCourse(course.id)) {
    course.lastSync = DateTime.now()
  } else {
    clearCourseSelection()
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
    userStore.updateUsers(
      queryClient.query(getGetCourseUsersEnrollmentsInfoQueryOptions(courseId)),
    ),
    recordStore.updateRecords(
      queryClient.query(getGetCourseUsersContentInfoQueryOptions(courseId)),
      queryClient.query({
        queryKey: courseLogsInfoQueryKey(courseId),
        queryFn: () => getCourseLogsInfo(courseId),
      }),
    ),
    gradeStore.updateGrades(
      queryClient.query(getGetCourseGradesInfoQueryOptions(courseId)),
      courseName,
    ),
  ])
}

export async function syncAll(courseId: number) {
  if (await syncAllForCourse(courseId)) {
    const course = courseStore.courseItems.find(({ id }) => id === courseId)
    if (course) course.lastSync = DateTime.now()
  }
}

async function syncAllForCourse(courseId: number) {
  const [enrollments, [content, logs], grades] = await Promise.all([
    runSyncMutation(getSyncCourseUsersEnrollmentsMutationOptions(), { courseId }),
    Promise.all([
      runSyncMutation(getSyncCourseContentMutationOptions(), { courseId }),
      runSyncMutation(getSyncCourseLogsMutationOptions(), { courseId }),
    ]),
    runSyncMutation(getSyncCourseGradesMutationOptions(), { courseId }),
  ])
  if (loginStore.token === null) return false

  await Promise.all([
    userStore.updateUsers(Promise.resolve(enrollments)),
    recordStore.updateRecords(Promise.resolve(content), Promise.resolve(logs)),
    gradeStore.updateGrades(
      Promise.resolve(grades),
      courseStore.courseItems.find(({ id }) => id === courseId)?.name ?? "",
    ),
    queryClient.invalidateQueries({
      queryKey: getGetCourseUsersEnrollmentsInfoQueryKey(courseId),
    }),
    queryClient.invalidateQueries({ queryKey: getGetCourseUsersContentInfoQueryKey(courseId) }),
    queryClient.invalidateQueries({ queryKey: getGetCourseGradesInfoQueryKey(courseId) }),
    queryClient.invalidateQueries({ queryKey: courseLogsInfoQueryKey(courseId) }),
  ])

  return true
}
