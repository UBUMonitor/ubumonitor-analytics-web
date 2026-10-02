import { getCourseUsersContentInfo } from "@/backend/services/course-content"
import { getCourseUsersEnrollmentsInfo } from "@/backend/services/course-enrollments"
import { updateChart } from "@/charts"
import { updateDashboard } from "@/dashboard"
import { courseStore } from "@/header/course.svelte"

export function setCourse(courseId: number) {
  const course = courseStore.courseItems.find((course) => course.id === courseId)

  if (!course) return

  courseStore.currentCourseId = course.id

  updateChart(course.startDate, course.endDate)
  updateDashboard(getCourseUsersEnrollmentsInfo(courseId), getCourseUsersContentInfo(courseId))
}
