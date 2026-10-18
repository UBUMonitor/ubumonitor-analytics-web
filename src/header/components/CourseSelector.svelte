<script lang="ts">
  import { syncCourseContent } from "@/backend/services/course-content"
  import { syncCourseUsersEnrollments } from "@/backend/services/course-enrollments"
  import { syncCourseLogs } from "@/backend/services/course-logs"
  import { syncUserEnrollments } from "@/backend/services/user-enrollments"
  import { updateDashboard } from "@/dashboard"
  import { clear } from "@/dashboard/dashboard.svelte"
  import { setCourse } from "@/header"
  import { courseStore } from "@/header/course.svelte"
  import { loginStore } from "@/login/login.svelte"
  import { m } from "@/shared/paraglide/messages"
  import { RefreshCwIcon } from "@lucide/svelte"

  $effect(() => {
    if (loginStore.userId) {
      syncUserEnrollments().then(({ courses }) => {
        courseStore.courseItems = courses.map((course) => ({
          id: course.id,
          name: course.fullName,
          startDate: course.startDate,
          endDate: course.endDate,
        }))
      })
    } else {
      courseStore.courseItems = []
      courseStore.currentCourseId = 0
    }
  })

  let sync = $state(false)

  const handleSync = async () => {
    try {
      sync = true

      clear()

      await updateDashboard(
        syncCourseUsersEnrollments(courseStore.currentCourseId),
        syncCourseContent(courseStore.currentCourseId),
        syncCourseLogs(courseStore.currentCourseId),
      )
    } finally {
      sync = false
    }
  }
</script>

<div class="flex items-center gap-2">
  <select
    class="select select-sm"
    name="course"
    disabled={sync}
    aria-label={m.select_course_label()}
    onchange={(e) => setCourse(Number(e.currentTarget.value))}
  >
    <option hidden> -- {m.select_course_label()} -- </option>
    {#each courseStore.courseItems as course (course.id)}
      <option value={course.id} selected={course.id === courseStore.currentCourseId}>
        {course.id} - {course.name}
      </option>
    {/each}
  </select>
  <button
    class="group btn size-fit p-1 btn-primary"
    class:invisible={!courseStore.currentCourseId}
    onclick={handleSync}
    disabled={sync}
    aria-label={m.sync_label()}
    title={m.sync_label()}
  >
    <RefreshCwIcon class="group-disabled:animate-spin" size={16} />
  </button>
</div>
