<script lang="ts">
  import { m } from "@/shared/paraglide/messages"
  import { exit } from "@tauri-apps/api/app"
</script>

<div class="modal-box">
  <h3 class="text-lg font-bold">{m.application_error_label()}</h3>
  <p class="py-4 text-error">{m.backend_error_label()}</p>
  <div class="modal-action">
    <button class="btn btn-error" onclick={() => exit()}>{m.close_application_button()}</button>
  </div>
</div>
