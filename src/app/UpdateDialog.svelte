<script lang="ts">
  import { closeDialog } from "@/dialog/dialog.svelte"
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
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength || NaN
            info(`started downloading ${event.data.contentLength} bytes`)
            break
          case "Progress":
            downloaded += event.data.chunkLength
            info(`downloaded ${downloaded} from ${contentLength}`)
            break
          case "Finished":
            info("download finished")
            break
        }
      })

      info("update installed")
      await relaunch()
    } catch (e) {
      errorMessage = String(e)
      error("Error updating: " + e)
    } finally {
      updateInProgress = false
    }
  }
</script>

<div class="modal-box">
  {#if updateInProgress}
    <h3 class="text-lg font-bold">Updating...</h3>
    <progress
      class="progress progress-primary"
      value={contentLength ? downloaded / contentLength : undefined}
      max="1"
    ></progress>
  {:else}
    <h3 class="text-lg font-bold">Update Available</h3>
    <p class="py-4">Do you want to update to version {update.version}?</p>

    {#if errorMessage}
      <div role="alert" class="alert alert-error mb-4">
        <span>Update failed: {errorMessage}</span>
      </div>
    {/if}

    <div class="modal-actions flex justify-end gap-2">
      <button class="btn btn-neutral" onclick={handleUpdate}>
        {errorMessage ? "Retry" : "Update"}
      </button>
      <button class="btn btn-error" onclick={closeDialog}>Cancel</button>
    </div>
  {/if}
</div>
