<script lang="ts">
  import { clearAppStore } from "@/lib/appStore.svelte"
  import { clearSession, getToken } from "@/lib/sessionStore.svelte"
  import { LogOutIcon } from "@lucide/svelte"

  const handleLogout = () => {
    clearAppStore()
    clearSession()
  }
</script>

<button class="btn size-fit p-1 btn-error" onclick={handleLogout} disabled={!getToken()}>
  <LogOutIcon size={16} />
</button>
