<script lang="ts">
  import { authLogout } from "@/backend/services/auth"
  import { clearAppStore, appStore } from "@/lib/appStore.svelte"
  import { LogOutIcon } from "@lucide/svelte"

  const handleLogout = () => {
    authLogout()
    clearAppStore()
  }
</script>

<button class="btn size-fit p-1 btn-error" onclick={handleLogout} disabled={!appStore.token}>
  <LogOutIcon size={16} />
</button>
