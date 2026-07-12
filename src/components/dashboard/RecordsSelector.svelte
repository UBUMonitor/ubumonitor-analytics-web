<script lang="ts">
  import { appStore } from "@/lib/appStore.svelte"
  import { m } from "@/paraglide/messages"
  import RecordItem from "./RecordItem.svelte"
  import Select from "./Select.svelte"

  interface Props {
    selected: string
  }

  let { selected = $bindable() }: Props = $props()
</script>

<div class="tabs-border tabs h-full">
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
