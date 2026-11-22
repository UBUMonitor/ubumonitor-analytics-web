<script lang="ts">
  import SafeImage from "../shared/SafeImage.svelte"
  import SelectorPanel from "@/components/records/SelectorPanel.svelte"
  import { m } from "@/paraglide/messages"
  import { isRecordChartKey, RECORD_CHARTS } from "@/services/records/charts"
  import { coursesStore } from "@/stores/courses.svelte"
  import { displayStore } from "@/stores/display.svelte"
  import { recordsStore, type RecordType } from "@/stores/records.svelte"
  import { usersStore } from "@/stores/users.svelte"
  import { ComponentIcon, FolderIcon } from "@lucide/svelte"
  import type { Snippet } from "svelte"

  const tabs: Record<RecordType, Snippet> = {
    components,
    events,
    sections,
    modules,
  }

  const displays = Object.entries(RECORD_CHARTS).map(([value, { name }]) => ({
    value,
    name,
  }))

  displayStore.display = displays
  displayStore.selectedDisplay = displays[0].value
  displayStore.showDate = true

  $effect(() => {
    const key = displayStore.selectedDisplay
    if (!isRecordChartKey(key)) return

    const { showScale, showInterval, build } = RECORD_CHARTS[key]

    displayStore.showScale = showScale
    displayStore.showInterval = showInterval

    build({
      courseId: coursesStore.currentCourse?.id,
      from: displayStore.from,
      to: displayStore.to,
      interval: displayStore.interval,
      scale: displayStore.scale,
      userItems: usersStore.selectedUsers,
      ...recordsStore.selection,
    }).then((display) => (displayStore.config = display))
  })
</script>

<div class="flex min-h-0 flex-1 flex-col">
  <div class="tabs-border tabs tabs-sm">
    {#each Object.keys(tabs) as RecordType[] as key (key)}
      <input
        type="radio"
        name="records_tabs"
        class="tab"
        aria-label={m[key]()}
        bind:group={recordsStore.selected}
        value={key}
      />
    {/each}
  </div>

  {@render tabs[recordsStore.selected]()}
</div>

{#snippet components()}
  <SelectorPanel
    items={recordsStore.components}
    ariaLabel={m.components()}
    isLoading={recordsStore.isLoading}
    bind:filter={recordsStore.componentsFilter}
  >
    {#snippet row(component)}
      {#if component.code.startsWith("mod_")}
        <SafeImage
          class="size-7 shrink-0"
          src="/icons/{component.code.slice(4)}.svg"
          alt={component.name}
        />
      {:else}
        <ComponentIcon class="size-7 shrink-0 p-0.5" />
      {/if}
      <span class="truncate">{component.name}</span>
    {/snippet}
  </SelectorPanel>
{/snippet}

{#snippet events()}
  <SelectorPanel
    items={recordsStore.events}
    ariaLabel={m.events()}
    isLoading={recordsStore.isLoading}
    bind:filter={recordsStore.eventsFilter}
  >
    {#snippet row(event)}
      {const component = event.component}
      {#if component.code.startsWith("mod_")}
        <SafeImage
          class="size-7 shrink-0"
          src="/icons/{component.code.slice(4)}.svg"
          alt={component.name}
        />
      {:else}
        <ComponentIcon class="size-7 shrink-0 p-0.5" />
      {/if}
      <span class="truncate" title={event.name}>{event.name}</span>
    {/snippet}
  </SelectorPanel>
{/snippet}

{#snippet sections()}
  <SelectorPanel
    items={recordsStore.sections}
    ariaLabel={m.events()}
    isLoading={recordsStore.isLoading}
    bind:filter={recordsStore.sectionsFilter}
    bind:hidden={recordsStore.sectionsHidden}
    dimmed={({ visible }) => !visible}
  >
    {#snippet row(section)}
      <FolderIcon class="size-7 p-0.5" />
      <span class="truncate">{section.name}</span>
    {/snippet}
  </SelectorPanel>
{/snippet}

{#snippet modules()}
  <SelectorPanel
    items={recordsStore.modules}
    ariaLabel={m.events()}
    isLoading={recordsStore.isLoading}
    bind:filter={recordsStore.modulesFilter}
    bind:hidden={recordsStore.modulesHidden}
    dimmed={({ visible }) => !visible}
  >
    {#snippet row(module)}
      <SafeImage class="size-7 shrink-0" src="/icons/{module.modName}.svg" alt={module.name} />
      <span class="truncate">{module.name}</span>
    {/snippet}
  </SelectorPanel>
{/snippet}
