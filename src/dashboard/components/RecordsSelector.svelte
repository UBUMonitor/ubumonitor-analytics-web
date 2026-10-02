<script lang="ts">
  import RecordItem from "@/dashboard/components/RecordItem.svelte"
  import { dashboardStore } from "@/dashboard/dashboard.svelte"
  import Select from "@/shared/components/Select.svelte"
  import { m } from "@/shared/paraglide/messages"

  interface Props {
    selected: string
  }

  let { selected = $bindable() }: Props = $props()
</script>

<div class="tabs tabs-border h-full">
  <input
    type="radio"
    name="records_tabs"
    class="tab"
    aria-label={m.section_label()}
    bind:group={selected}
    value="section"
  />
  <div class="tab-content">
    <Select component={RecordItem} items={dashboardStore.sectionItems} />
  </div>

  <input
    type="radio"
    name="records_tabs"
    class="tab"
    aria-label={m.modules_label()}
    bind:group={selected}
    value="module"
  />
  <div class="tab-content">
    <Select component={RecordItem} items={dashboardStore.moduleItems} />
  </div>
</div>
