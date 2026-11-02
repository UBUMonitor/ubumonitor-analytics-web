<script lang="ts">
  import { dialog } from "@/shared/components/dialog/dialog-state.svelte"
  import type { Attachment } from "svelte/attachments"

  const attachDialog: Attachment<HTMLDialogElement> = (element) => {
    dialog.dialogRef = element
    return () => {
      if (dialog.dialogRef === element) dialog.dialogRef = null
    }
  }
</script>

<dialog
  id="main_dialog"
  class="modal"
  {@attach attachDialog}
  onclose={() => dialog.reset()}
  oncancel={(e) => e.preventDefault()}
>
  {#if dialog.component}
    <dialog.component {...dialog.props} />
  {/if}
</dialog>
