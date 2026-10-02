<script lang="ts">
  import { syncCourseContent } from "@/backend/services/course-content"
  import { syncCourseUsersEnrollments } from "@/backend/services/course-enrollments"
  import { syncCourseLogs } from "@/backend/services/course-logs"
  import { updateDashboard } from "@/dashboard"
  import { courseStore } from "@/header/course.svelte"
  import { RefreshCwIcon } from "@lucide/svelte"

  let sync = $state(false)

  const handleSync = async () => {
    try {
      sync = true

      await Promise.all([
        updateDashboard(
          syncCourseUsersEnrollments(courseStore.currentCourseId),
          syncCourseContent(courseStore.currentCourseId),
        ),
        syncCourseLogs(courseStore.currentCourseId),
      ])
    } finally {
      sync = false
    }
  }
</script>

<button
  class="group btn size-fit p-1"
  onclick={handleSync}
  hidden={!courseStore.currentCourseId}
  disabled={sync}
>
  <RefreshCwIcon class="group-disabled:animate-spin" size={16} />
</button>
