<script lang="ts">
  import RecordsSelector from "@/dashboard/RecordsSelector.svelte"
  import { appStore, type Info } from "@/lib/appStore.svelte"
  import { m } from "@/paraglide/messages"

  let selectedTab = $state("records")
  let recordSelected = $state<Info>("section")

  $effect(() => {
    if (selectedTab === "records") {
      appStore.selectedInfo = recordSelected
    }
  })
</script>

<div class="tabs tabs-border min-w-0 border-t">
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
