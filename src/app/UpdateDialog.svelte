<script lang="ts">
  import { closeDialog } from "@/dialog/dialog.svelte"
  import { relaunch } from "@tauri-apps/plugin-process"
  import type { Update } from "@tauri-apps/plugin-updater"

  interface Props {
    update: Update
  }

  let { update }: Props = $props()

  let updateInProgress = $state(false)

  const handleUpdate = async () => {
    updateInProgress = true
    await update.downloadAndInstall()

    await relaunch()
  }

  const handleCancel = () => {
    closeDialog()
  }
</script>

<div class="modal-box">
  {#if updateInProgress}
    <h3 class="text-lg font-bold">Updating...</h3>
    <span class="loading loading-spinner"></span>
  {:else}
    <h3 class="text-lg font-bold">Update Available</h3>
    <p class="py-4">Do you want to update to version {update.version}?</p>
    <div class="modal-actions">
      <button class="btn btn-neutral" onclick={handleUpdate}>Update</button>
      <button class="btn btn-error" onclick={handleCancel}>Cancel</button>
    </div>
  {/if}
</div>
