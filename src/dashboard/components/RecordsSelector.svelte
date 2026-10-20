<script lang="ts">
  import RecordItem from "@/dashboard/components/RecordItem.svelte"
  import { dashboardStore } from "@/dashboard/dashboard.svelte"
  import Select from "@/shared/components/Select.svelte"
  import SelectButtons from "@/shared/components/SelectButtons.svelte"
  import { m } from "@/shared/paraglide/messages"

  interface Props {
    selected: string
  }

  let { selected = $bindable() }: Props = $props()

  const tabs = [
    { value: "component", label: m.components_label, items: () => dashboardStore.componentItems },
    { value: "event", label: m.events_label, items: () => dashboardStore.eventItems },
    { value: "section", label: m.section_label, items: () => dashboardStore.sectionItems },
    { value: "module", label: m.modules_label, items: () => dashboardStore.moduleItems },
  ]
</script>

<div class="tabs tabs-border h-full tabs-sm">
  {#each tabs as tab (tab.value)}
    <input
      type="radio"
      name="records_tabs"
      class="tab"
      aria-label={tab.label()}
      bind:group={selected}
      value={tab.value}
    />
    <div class="tab-content">
      <SelectButtons class="border-b border-base-200 p-1" items={tab.items()} />
      <Select component={RecordItem} items={tab.items()} ariaLabel={tab.label()} />
    </div>
  {/each}
</div>
