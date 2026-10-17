<script lang="ts">
  import { syncCourseContent } from "@/backend/services/course-content"
  import { syncCourseUsersEnrollments } from "@/backend/services/course-enrollments"
  import { syncCourseLogs } from "@/backend/services/course-logs"
  import { updateDashboard } from "@/dashboard"
  import { clear } from "@/dashboard/dashboard.svelte"
  import { courseStore } from "@/header/course.svelte"
  import { m } from "@/shared/paraglide/messages"
  import { RefreshCwIcon } from "@lucide/svelte"

  let sync = $state(false)

  const handleSync = async () => {
    try {
      sync = true

      clear()

      await Promise.all([
        updateDashboard(
          syncCourseUsersEnrollments(courseStore.currentCourseId),
          syncCourseContent(courseStore.currentCourseId),
          syncCourseLogs(courseStore.currentCourseId),
        ),
      ])
    } finally {
      sync = false
    }
  }
</script>

<button
  class="group btn btn-primary size-fit p-1"
  class:invisible={!courseStore.currentCourseId}
  onclick={handleSync}
  disabled={sync}
  aria-label={m.sync_label()}
  title={m.sync_label()}
>
  <RefreshCwIcon class="group-disabled:animate-spin" size={16} />
</button>
