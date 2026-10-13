<script lang="ts">
  import RecordsSelector from "@/dashboard/components/RecordsSelector.svelte"
  import { dashboardStore, type Info } from "@/dashboard/dashboard.svelte"
  import { m } from "@/shared/paraglide/messages"

  let selectedTab = $state("records")
  let recordSelected = $state<Info>("component")

  $effect(() => {
    if (selectedTab === "records") {
      dashboardStore.selectedInfo = recordSelected
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
