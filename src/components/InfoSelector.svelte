<script lang="ts">
  import GradesSelector from "@/components/grades/GradesSelector.svelte"
  import RecordsSelector from "@/components/records/RecordsSelector.svelte"
  import { m } from "@/paraglide/messages"

  type Info = "records" | "grades"

  let selectedTab = $state<Info>("records")

  const tabs = {
    records: {
      label: m.records(),
      component: RecordsSelector,
    },
    grades: {
      label: m.grades(),
      component: GradesSelector,
    },
  } as const

  const SelectedComponent = $derived(tabs[selectedTab].component)
</script>

<div class="card min-h-0 flex-1 border-base-300 bg-base-100 p-1 card-border">
  <div class="tabs-border tabs tabs-sm">
    {#each Object.entries(tabs) as [key, value] (key)}
      <input
        type="radio"
        name="main_tabs"
        class="tab"
        aria-label={value.label}
        bind:group={selectedTab}
        value={key}
      />
    {/each}
  </div>
  <SelectedComponent />
</div>
