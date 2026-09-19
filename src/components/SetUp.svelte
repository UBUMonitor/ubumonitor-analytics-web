<script lang="ts">
  import { m } from "@/paraglide/messages"
  import { invoke } from "@tauri-apps/api/core"
  import { debug, error, info } from "@tauri-apps/plugin-log"
  import { relaunch } from "@tauri-apps/plugin-process"
  import { check } from "@tauri-apps/plugin-updater"
  import { onMount } from "svelte"

  // eslint-disable-next-line no-useless-assignment
  let { done = $bindable(false) } = $props()

  let currentStep = $state("")
  let hasError = $state(false)

  async function updateApp() {
    currentStep = m.checking_updates_label()

    try {
      info("Checking for updates...")
      const update = await check({ timeout: 5000 })

      if (update) {
        debug("Update found, start dowloading...")

        await update.download(
          ({ event }) => {
            if (event === "Started") {
              currentStep = m.downloading_update_label()
            }
          },
          { timeout: 5000 },
        )

        debug("Download complete, installing...")

        currentStep = m.installing_update_label()
        await update.install()

        debug("Installation completed, restarting...")

        currentStep = m.restarting_label()
        await relaunch()
      }
    } catch (err) {
      hasError = true
      error(`Error during the update process: ${err}`)
      throw err
    }
  }

  onMount(() => {
    updateApp()
      .then(() => {
        currentStep = m.preparing_application_label()
        return invoke<void>("ensure_backend_server")
      })
      .then(() => (done = true))
      .catch((err) => error(`Error in startup flow: ${err}`))
  })
</script>

<div class="card w-96 bg-base-200 shadow-sm card-lg">
  <div class="card-body">
    <h1 class="card-title">{currentStep}</h1>
    <div class="flex flex-col items-center gap-3">
      {#if hasError}
        <p class="text-sm text-error">Error (check logs)</p>
      {:else}
        <span class="loading loading-lg loading-spinner"></span>
      {/if}
    </div>
  </div>
</div>
