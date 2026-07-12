<script lang="ts">
  import { getCurrentCourseId, getUserId, setCurrentCourseId } from "@/lib/sessionStore.svelte"
  import { m } from "@/paraglide/messages.js"
  import {
    syncUserEnrollments,
    type syncUserEnrollmentsResponseSuccess,
  } from "@/services/user-enrollments/user-enrollments"

  const userId = $derived(getUserId())

  const userCourses = $derived(
    userId
      ? syncUserEnrollments().then(
          (response) => (response as syncUserEnrollmentsResponseSuccess).data,
        )
      : undefined,
  )

  const handleCourseChange = (event: Event) => {
    const selectElement = event.currentTarget as HTMLSelectElement
    setCurrentCourseId(Number(selectElement.value))
  }
</script>

{#if userId}
  {#await userCourses}
    <p>Loading user courses...</p>
  {:then data}
    {#if data}
      <select class="select w-lg select-sm" name="course" onchange={handleCourseChange}>
        <option hidden> -- {m.select_course_label()} -- </option>
        {#each data.courses as course (course.id)}
          <option value={course.id} selected={course.id === getCurrentCourseId()}>
            {course.id} - {course.fullName}
          </option>
        {/each}
      </select>
    {/if}
  {:catch error}
    <p>Error loading user courses: {error.message}</p>
  {/await}
{/if}
