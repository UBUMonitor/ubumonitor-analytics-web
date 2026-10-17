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

<div class="card card-border border-base-300 bg-base-100 p-1 min-h-0 flex-1">
  <div class="tabs tabs-border h-full">
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
</div>
