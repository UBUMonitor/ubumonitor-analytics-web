<script lang="ts">
  import { m } from "@/shared/paraglide/messages"
  import { exit } from "@tauri-apps/api/app"
</script>

<div class="modal-box">
  <h3 class="text-lg font-bold">{m.application_error()}</h3>
  <p class="py-4 text-error">{m.backend_start_error()}</p>
  <div class="modal-action">
    <button type="button" class="btn btn-error" onclick={() => exit()}
      >{m.close_application()}</button
    >
  </div>
</div>
