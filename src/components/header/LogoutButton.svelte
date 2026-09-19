<script lang="ts">
  import { clearAppStore, appStore } from "@/lib/appStore.svelte"
  import { authLogout } from "@/services/auth/auth"
  import { LogOutIcon } from "@lucide/svelte"

  const handleLogout = () => {
    authLogout()
    clearAppStore()
  }
</script>

<button class="btn size-fit p-1 btn-error" onclick={handleLogout} disabled={!appStore.token}>
  <LogOutIcon size={16} />
</button>
