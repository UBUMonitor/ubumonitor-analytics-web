<script lang="ts">
  import { changeCourse, syncAll } from "@/dashboard/course"
  import { courseStore } from "@/dashboard/course.svelte"
  import { AsyncAction } from "@/shared/lib/async.svelte"
  import { m } from "@/shared/paraglide/messages"
  import { RefreshCwIcon } from "@lucide/svelte"
  import type { ChangeEventHandler } from "svelte/elements"

  const action = new AsyncAction()

  const handleOnChange: ChangeEventHandler<HTMLSelectElement> = async (e) => {
    await action.run(() => changeCourse(Number(e.currentTarget.value)))
  }

  const handleSync = async () => {
    const courseId = courseStore.currentCourse?.id
    if (courseId === undefined) return
    await action.run(() => syncAll(courseId))
  }
</script>

<div class="flex items-center gap-2">
  <select
    class="select select-sm"
    name="course"
    disabled={action.loading || courseStore.courseItems.length === 0}
    aria-label={m.select_course()}
    value={courseStore.currentCourse?.id}
    onchange={handleOnChange}
  >
    <option value="" hidden>-- {m.select_course()} --</option>
    {#each courseStore.courseItems as course (course.id)}
      <option value={course.id}>{course.id} - {course.name}</option>
    {/each}
  </select>
  <button
    class={[
      "group btn btn-square p-1 btn-primary btn-sm",
      !courseStore.currentCourse?.id && "invisible",
    ]}
    type="button"
    onclick={handleSync}
    disabled={action.loading || !courseStore.currentCourse}
    aria-label={m.sync_course_data()}
    title={m.sync_course_data()}
  >
    <RefreshCwIcon />
  </button>
</div>
