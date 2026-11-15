<script lang="ts">
  import { m } from "@/paraglide/messages"
  import { coursesStore } from "@/stores/courses.svelte"
  import { gradesStore } from "@/stores/grades.svelte"
  import { recordsStore } from "@/stores/records.svelte"
  import { usersStore } from "@/stores/users.svelte"
  import { RefreshCwIcon } from "@lucide/svelte"
  import { toast } from "svelte-sonner"

  let isSyncing = $derived(usersStore.isLoading || recordsStore.isLoading || gradesStore.isLoading)

  const handleSync = async () => {
    isSyncing = true
    try {
      await Promise.all([usersStore.sync(), recordsStore.sync(), gradesStore.sync()])
      toast.success(m.sync_course_data_success({ course: coursesStore.currentCourse!.name }))
    } finally {
      isSyncing = false
    }
  }
</script>

<div class="flex items-center gap-2">
  <select
    class="select flex-1 select-sm"
    name="course"
    disabled={coursesStore.courses.length === 0 || isSyncing}
    aria-label={m.select_course()}
    bind:value={coursesStore.currentCourse}
  >
    <option value={null} hidden>-- {m.select_course()} --</option>
    {#each coursesStore.courses as course (course.id)}
      <option value={course}>{course.id} - {course.name}</option>
    {/each}
  </select>
  <button
    class="group btn btn-square p-1 btn-primary btn-sm"
    class:invisible={!coursesStore.currentCourse?.id}
    onclick={handleSync}
    disabled={isSyncing}
    aria-label={m.sync_course_data()}
    title={m.sync_course_data()}
  >
    <RefreshCwIcon class="group-disabled:animate-spin" />
  </button>
</div>
