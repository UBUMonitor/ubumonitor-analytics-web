<script lang="ts">
  import { m } from "@/paraglide/messages"
  import { invoke } from "@tauri-apps/api/core"
  import { error, info } from "@tauri-apps/plugin-log"
  import { relaunch } from "@tauri-apps/plugin-process"
  import { check } from "@tauri-apps/plugin-updater"
  import { onMount } from "svelte"

  // eslint-disable-next-line no-useless-assignment
  let { done = $bindable(false) } = $props()

  let currentStep = $state("")
  let hasError = $state(false)

  async function updateApp() {
    currentStep = m.checking_updates_label()

    const update = await check({ timeout: 5000 })

    if (update) {
      info(`Found update ${update.version}`)

      await update.download(
        ({ event }) => {
          if (event === "Started") {
            currentStep = m.downloading_update_label()
          }
        },
        { timeout: 5000 },
      )

      info("Download complete, installing...")

      currentStep = m.installing_update_label()

      await update.install()

      info("Installation completed, restarting...")

      currentStep = m.restarting_label()

      await relaunch()
    }
  }

  onMount(() => {
    updateApp()
      .then(() => {
        currentStep = m.preparing_application_label()
        return invoke<void>("ensure_backend_server")
      })
      .then(() => (done = true))
      .catch((err) => {
        hasError = true
        error(`Error in startup flow: ${err}`)
      })
  })
</script>

<div class="card w-96 bg-base-200 shadow card-lg m-auto">
  <div class="card-body">
    <h1 class="card-title">{currentStep}</h1>
    <div class="flex flex-col items-center gap-3">
      {#if hasError}
        <p class="text-sm text-error">Error on startup (check logs)</p>
      {:else}
        <span class="loading loading-lg loading-spinner"></span>
      {/if}
    </div>
  </div>
</div>
