<script lang="ts">
  import SyncButton from "./SyncButton.svelte"
  import { syncUserEnrollments } from "@/backend/services/user-enrollments"
  import { setCourse } from "@/header"
  import { courseStore } from "@/header/course.svelte"
  import { loginStore } from "@/login/login.svelte"
  import { m } from "@/shared/paraglide/messages.js"

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
</script>

<div class="flex items-center gap-2">
  <select
    class="select select-sm"
    name="course"
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
  <SyncButton />
</div>
