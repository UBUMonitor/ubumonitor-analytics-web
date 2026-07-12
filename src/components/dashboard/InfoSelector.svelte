<script lang="ts">
  import { appStore, type Info } from "@/lib/appStore.svelte"
  import { m } from "@/paraglide/messages"
  import RecordsSelector from "./RecordsSelector.svelte"

  let selectedTab = $state("records")
  let recordSelected = $state<Info>("section")

  $effect(() => {
    if (selectedTab === "records") {
      appStore.selectedInfo = recordSelected
    }
  })
</script>

<div class="tabs-border tabs min-w-0 border-t">
  <input
    type="radio"
    name="main_tabs"
    class="tab"
    aria-label={m.records_label()}
    bind:group={selectedTab}
    value="records"
  />
  <div class="tab-content">
    <RecordsSelector bind:selected={recordSelected} />
  </div>

  <!-- TODO -->
</div>
