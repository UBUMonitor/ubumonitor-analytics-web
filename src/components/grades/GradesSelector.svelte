<script lang="ts">
  import SafeImage from "../shared/SafeImage.svelte"
  import SelectorPanel from "@/components/records/SelectorPanel.svelte"
  import { m } from "@/paraglide/messages"
  import { GRADE_CHARTS, isGradeChartKey } from "@/services/grades/charts"
  import { coursesStore } from "@/stores/courses.svelte"
  import { displayStore } from "@/stores/display.svelte"
  import { gradesStore } from "@/stores/grades.svelte"
  import { recordsStore } from "@/stores/records.svelte"
  import { usersStore } from "@/stores/users.svelte"
  import {
    CircleQuestionMarkIcon,
    CircleXIcon,
    FolderIcon,
    GraduationCapIcon,
    SquarePenIcon,
  } from "@lucide/svelte"

  const displays = Object.entries(GRADE_CHARTS).map(([value, { name }]) => ({
    value,
    name,
  }))

  displayStore.display = displays
  displayStore.selectedDisplay = displays[0].value
  displayStore.showDate = false
  displayStore.showScale = false
  displayStore.showInterval = false

  $effect(() => {
    const key = displayStore.selectedDisplay
    if (!isGradeChartKey(key)) return

    GRADE_CHARTS[key]
      .build({
        courseId: coursesStore.currentCourse?.id,
        gradeItems: gradesStore.filteredGrades.filter(({ checked }) => checked),
        userItems: usersStore.selectedUsers,
      })
      .then((display) => (displayStore.config = display))
  })
</script>

<SelectorPanel
  items={gradesStore.filteredGrades}
  ariaLabel={m.grades()}
  isLoading={gradesStore.isLoading}
  bind:filter={gradesStore.gradesFilter}
  isTree
>
  {#snippet row({ itemType, moduleId, name })}
    {#if itemType === "MOD" && moduleId != null}
      {const modName = $derived(recordsStore.modules.find(({ id }) => id === moduleId)?.modName)}
      {#if modName}
        <SafeImage class="size-7" src="/icons/{modName}.svg" alt={modName} />
      {:else}
        <CircleXIcon class="size-7 p-0.5" />
      {/if}
    {:else if itemType === "CATEGORY"}
      <FolderIcon class="size-7 p-0.5" />
    {:else if itemType === "COURSE"}
      <GraduationCapIcon class="size-7 p-0.5" />
    {:else if itemType === "MANUAL"}
      <SquarePenIcon class="size-7 p-0.5" />
    {:else if itemType === "BLOCKS"}
      <CircleQuestionMarkIcon class="size-7 p-0.5" />
    {/if}
    <span class="min-w-0 flex-1 truncate">{name}</span>
  {/snippet}
</SelectorPanel>
