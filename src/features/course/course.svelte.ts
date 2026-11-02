import { loginStore } from "@/features/auth/login.svelte"
import type { EnrollmentsResponseDto } from "@/shared/api/model"
import { fromSecondsOrUndefined } from "@/shared/lib/datetime"
import type { DateTime } from "luxon"

export interface CourseItem {
  id: number
  name: string
  startDate?: DateTime<true>
  endDate?: DateTime<true>
  lastSync?: DateTime<true>
}

class CourseStore {
  currentCourse = $state<CourseItem | null>(null)
  courseItems = $state<CourseItem[]>([])

  reset() {
    this.currentCourse = null
    this.courseItems = []
  }

  async updateCourses(enrollments: Promise<EnrollmentsResponseDto>) {
    const { courses } = await enrollments
    if (loginStore.token === null) return

    this.courseItems = courses.map((course) => ({
      id: course.id,
      name: course.fullName,
      startDate: fromSecondsOrUndefined(course.startDate),
      endDate: fromSecondsOrUndefined(course.endDate),
      lastSync: fromSecondsOrUndefined(course.lastSync),
    }))
  }
}

export const courseStore = new CourseStore()
