<script lang="ts">
  import { appStore } from "@/lib/appStore.svelte"
  import { update } from "@/lib/moodle"
  import type { CourseContentResponseDto, CourseEnrollmentsResponseDto } from "@/model"
  import { syncCourseContent } from "@/services/course-content/course-content"
  import { syncCourseUsersEnrollments } from "@/services/course-enrollments/course-enrollments"
  import { syncCourseLogs } from "@/services/course-logs/course-logs"
  import { RefreshCwIcon } from "@lucide/svelte"

  let sync = $state(false)

  const handleSync = async () => {
    sync = true

    await update(
      syncCourseUsersEnrollments(appStore.currentCourseId).then(
        ({ data }) => (data as CourseEnrollmentsResponseDto).users,
      ),
      syncCourseContent(appStore.currentCourseId).then(
        ({ data }) => (data as CourseContentResponseDto).sections,
      ),
    )

    await syncCourseLogs(appStore.currentCourseId)

    sync = false
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
