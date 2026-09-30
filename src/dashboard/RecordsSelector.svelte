<script lang="ts">
  import Select from "@/components/Select.svelte"
  import RecordItem from "@/dashboard/RecordItem.svelte"
  import { appStore } from "@/lib/appStore.svelte"
  import { m } from "@/paraglide/messages"

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
    <Select component={RecordItem} items={appStore.sectionItems} />
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
    <Select component={RecordItem} items={appStore.moduleItems} />
  </div>
</div>
