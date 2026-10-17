<script lang="ts">
  import { closeDialog } from "@/dialog/dialog.svelte"
  import { m } from "@/shared/paraglide/messages"
  import { invoke } from "@tauri-apps/api/core"
  import { error, info } from "@tauri-apps/plugin-log"
  import { relaunch } from "@tauri-apps/plugin-process"
  import type { Update } from "@tauri-apps/plugin-updater"

  interface Props {
    update: Update
  }

  let { update }: Props = $props()

  let updateInProgress = $state(false)

  let downloaded = $state(0)
  let contentLength = $state(0)

  let errorMessage = $state<string | null>(null)

  const handleUpdate = async () => {
    try {
      updateInProgress = true
      await update.download((event) => {
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength || NaN
            info(`started downloading ${event.data.contentLength} bytes`)
            break
          case "Progress":
            downloaded += event.data.chunkLength
            break
          case "Finished":
            info("download finished")
            break
        }
      })

      await invoke<void>("stop_backend")

      await update.install()

      info("update installed")
      await relaunch()
    } catch (e) {
      errorMessage = String(e)
      error("Error updating: " + e)
    } finally {
      updateInProgress = false
    }
  }

  const handleCancel = () => {
    closeDialog()
    update.close()
  }
</script>

<div class="modal-box">
  {#if updateInProgress}
    <h3 class="text-lg font-bold">{m.update_in_progress()}</h3>
    <progress
      class="progress progress-primary"
      value={contentLength ? downloaded / contentLength : undefined}
      max="1"
    ></progress>
  {:else}
    <h3 class="text-lg font-bold">{m.update_available()}</h3>
    <p class="py-4">{m.update_prompt({ version: update.version })}</p>

    {#if errorMessage}
      <div role="alert" class="alert alert-error mb-4">
        <span>{m.update_failed({ error: errorMessage })}</span>
      </div>
    {/if}

    <div class="modal-actions flex justify-end gap-2">
      <button class="btn btn-neutral" onclick={handleUpdate}>
        {errorMessage ? m.retry_button() : m.update_button()}
      </button>
      <button class="btn btn-error" onclick={handleCancel}>{m.cancel_button()}</button>
    </div>
  {/if}
</div>
