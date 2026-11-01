<script lang="ts">
  import { dialog } from "@/dialog/dialog.svelte"
</script>

<dialog
  id="main_dialog"
  class="modal"
  bind:this={dialog.dialogRef}
  onclose={() => dialog.reset()}
  oncancel={(e) => e.preventDefault()}
>
  {#if dialog.component}
    <dialog.component {...dialog.props} />
  {/if}
</dialog>
