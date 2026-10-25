import type { DateTime } from "luxon"

export interface CourseItem {
  id: number
  name: string
  startDate?: DateTime<true>
  endDate?: DateTime<true>
  lastSync?: DateTime<true>
}

export const courseStore = $state({
  currentCourseId: 0,
  courseItems: [] as CourseItem[],
})

export function clearAppStore() {
  courseStore.currentCourseId = 0
  courseStore.courseItems = []
}
