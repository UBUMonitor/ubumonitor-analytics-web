<script lang="ts">
  import { m } from "@/shared/paraglide/messages"
</script>

<div role="status" class="alert w-80 alert-info shadow-lg">
  <span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
  <span class="min-w-0 flex-1">{m.sync_course_data()}</span>
</div>
