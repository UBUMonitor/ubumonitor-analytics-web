<script lang="ts">
  import { dialogStore } from "@/stores/dialog.svelte"
</script>

<dialog
  id="main_dialog"
  class="modal"
  bind:this={dialogStore.dialogRef}
  onclose={dialogStore.closeDialog}
  oncancel={(e) => e.preventDefault()}
>
  <dialogStore.component {...dialogStore.props} />
</dialog>
