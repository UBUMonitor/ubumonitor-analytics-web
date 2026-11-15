<script lang="ts">
  import SelectorPanel from "@/components/records/SelectorPanel.svelte"
  import { m } from "@/paraglide/messages"
  import { gradesStore } from "@/stores/grades.svelte"
  import { recordsStore } from "@/stores/records.svelte"
  import {
    CircleQuestionMarkIcon,
    CircleXIcon,
    FolderIcon,
    GraduationCapIcon,
    SquarePenIcon,
  } from "@lucide/svelte"
</script>

{@render grades()}

{#snippet grades()}
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
          <img class="size-7" src="/icons/{modName}.svg" alt={modName} />
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
{/snippet}
