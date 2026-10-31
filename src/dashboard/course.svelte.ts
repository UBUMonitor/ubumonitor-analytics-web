import type { DateTime } from "luxon"

export interface CourseItem {
  id: number
  name: string
  startDate?: DateTime<true>
  endDate?: DateTime<true>
  lastSync?: DateTime<true>
}

export const courseStore = $state({
  currentCourse: null as CourseItem | null,
  courseItems: [] as CourseItem[],
})

export function clearAppStore() {
  courseStore.currentCourse = null
  courseStore.courseItems = []
}
