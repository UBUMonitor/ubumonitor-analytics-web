<script lang="ts">
  import { closeDialog, dialog } from "@/dialog/dialog.svelte"
</script>

<dialog id="main_dialog" class="modal" bind:this={dialog.dialogRef} onclose={closeDialog}>
  <dialog.component {...dialog.props} />
</dialog>
