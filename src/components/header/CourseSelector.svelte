<script lang="ts">
  import { appStore } from "@/lib/appStore.svelte"
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

  const handleCourseChange = (
    event: Event,
    coursesMap: Map<number, { startDate: string | null; endDate: string | null }>,
  ) => {
    const selectElement = event.currentTarget as HTMLSelectElement
    const courseId = Number(selectElement.value)
    setCurrentCourseId(courseId)

    const course = coursesMap.get(courseId)

    appStore.from =
      course?.startDate?.slice(0, 16) ??
      ((d) => (d.setMonth(d.getMonth() - 6), d))(new Date()).toISOString().slice(0, 16)
    appStore.to = course?.endDate?.slice(0, 16) ?? new Date().toISOString().slice(0, 16)
  }
</script>

{#if userId}
  {#await userCourses}
    <p>Loading user courses...</p>
  {:then data}
    {#if data}
      {@const coursesMap = new Map(data.courses.map((c) => [c.id, c]))}
      <select
        class="select w-lg select-sm"
        name="course"
        onchange={(event) => handleCourseChange(event, coursesMap)}
      >
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
