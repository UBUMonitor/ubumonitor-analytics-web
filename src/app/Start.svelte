<script lang="ts">
  import { m } from "@/shared/paraglide/messages"
  import { info } from "@tauri-apps/plugin-log"
  import ky from "ky"
  import { onMount } from "svelte"

  // eslint-disable-next-line no-useless-assignment
  let { done = $bindable(false) } = $props()

  let hasError = $state(false)

  onMount(() => {
    info("Starting application...")
    ky.get("http://localhost:9090/actuator/health", {
      retry: {
        limit: 100,
        delay: () => 250,
      },
    })
      .then(() => {
        done = true
        info("Server is ready")
      })
      .catch(() => {
        hasError = true
      })
  })
</script>

<div class="card w-96 bg-base-100 shadow card-lg m-auto">
  <div class="card-body">
    <h1 class="card-title">{m.starting_application_label()}</h1>
    <div class="flex flex-col items-center gap-3">
      {#if hasError}
        <p class="text-sm text-error">{m.startup_error_label()}</p>
      {:else}
        <span class="loading loading-lg loading-spinner"></span>
      {/if}
    </div>
  </div>
</div>
