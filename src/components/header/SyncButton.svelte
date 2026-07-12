<script lang="ts">
  import { getCurrentCourseId } from "@/lib/sessionStore.svelte"
  import { syncCourseContent } from "@/services/course-content/course-content"
  import { syncCourseUsersEnrollments } from "@/services/course-enrollments/course-enrollments"
  import { syncCourseLogs } from "@/services/course-logs/course-logs"
  import { RefreshCcwIcon } from "@lucide/svelte"

  let sync = $state(false)

  const handleSync = async () => {
    sync = true

    await syncCourseUsersEnrollments(getCurrentCourseId())
    await syncCourseContent(getCurrentCourseId())
    await syncCourseLogs(getCurrentCourseId())

    window.location.reload()

    sync = false
  }
</script>

<button
  class="group btn size-fit p-1"
  onclick={handleSync}
  hidden={!getCurrentCourseId()}
  disabled={sync}
>
  <RefreshCcwIcon class="group-disabled:animate-spin" size={16} />
</button>
