<script lang="ts">
  import { syncCourseContent } from "@/backend/services/course-content"
  import { syncCourseUsersEnrollments } from "@/backend/services/course-enrollments"
  import { syncCourseLogs } from "@/backend/services/course-logs"
  import { appStore } from "@/lib/appStore.svelte"
  import { update } from "@/lib/moodle"
  import { RefreshCwIcon } from "@lucide/svelte"

  let sync = $state(false)

  const handleSync = async () => {
    try {
      sync = true

      await Promise.all([
        update(
          syncCourseUsersEnrollments(appStore.currentCourseId),
          syncCourseContent(appStore.currentCourseId),
        ),
        syncCourseLogs(appStore.currentCourseId),
      ])
    } finally {
      sync = false
    }
  }
</script>

<button
  class="group btn size-fit p-1"
  onclick={handleSync}
  hidden={!appStore.currentCourseId}
  disabled={sync}
>
  <RefreshCwIcon class="group-disabled:animate-spin" size={16} />
</button>
