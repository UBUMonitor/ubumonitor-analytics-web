import type { EnrollmentsResponseDto } from "@/backend/model"
import { loginStore } from "@/login/login.svelte"
import { fromSecondsOrUndefined } from "@/shared/lib/datetime"
import { notifyError, notifySyncStart } from "@/shared/lib/notify"
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
  isSyncing = $state(false)

  reset() {
    this.currentCourse = null
    this.courseItems = []
  }

  async updateCourses(enrollments: Promise<EnrollmentsResponseDto>) {
    const stopSyncToast = notifySyncStart()
    try {
      const { courses } = await enrollments
      if (loginStore.token === null) return

      this.courseItems = courses.map((course) => ({
        id: course.id,
        name: course.fullName,
        startDate: fromSecondsOrUndefined(course.startDate),
        endDate: fromSecondsOrUndefined(course.endDate),
        lastSync: fromSecondsOrUndefined(course.lastSync),
      }))
    } catch (error) {
      notifyError(error)
    } finally {
      stopSyncToast()
    }
  }
}

export const courseStore = new CourseStore()
