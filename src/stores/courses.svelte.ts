import { syncCurrentUserEnrollments } from "@/backend/services/user-enrollments"
import { loginStore } from "@/stores/login.svelte"
import { DateTime } from "luxon"

export interface Course {
  id: number
  name: string
  startDate?: DateTime<true>
  endDate?: DateTime<true>
  lastSync?: DateTime<true>
}

class CoursesStore {
  courses = $state.raw<Course[]>([])
  currentCourse = $state.raw<Course | null>(null)

  constructor() {
    $effect.root(() => {
      $effect(() => {
        console.log("$effect CoursesStore")
        if (loginStore.token == null) {
          this.clear()
          return
        }

        syncCurrentUserEnrollments().then(({ courses }) => {
          this.courses = courses.map(({ id, fullName, startDate, endDate, lastSync }) => ({
            id,
            name: fullName,
            startDate: startDate ? (DateTime.fromSeconds(startDate) as DateTime<true>) : undefined,
            endDate: endDate ? (DateTime.fromSeconds(endDate) as DateTime<true>) : undefined,
            lastSync: lastSync ? (DateTime.fromSeconds(lastSync) as DateTime<true>) : undefined,
          }))
        })
      })
    })
  }

  changeCourse(courseId: number) {
    this.currentCourse = this.courses.find(({ id }) => id === courseId) ?? null
  }

  clear() {
    this.courses = []
    this.currentCourse = null
  }
}

export const coursesStore = new CoursesStore()
