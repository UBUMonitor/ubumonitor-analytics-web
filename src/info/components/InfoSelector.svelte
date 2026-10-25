<script lang="ts">
  import RecordsSelector from "@/info/record/components/RecordsSelector.svelte"
  import { m } from "@/shared/paraglide/messages"

  let selectedTab = $state("records")
</script>

<div class="card min-h-0 flex-1 border-base-300 bg-base-100 p-1 card-border">
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
      <RecordsSelector active={selectedTab === "records"} />
    </div>

    <!-- TODO -->
  </div>
</div>
