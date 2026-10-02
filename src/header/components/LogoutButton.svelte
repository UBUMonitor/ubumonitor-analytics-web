<script lang="ts">
  import { logout } from "@/login"
  import { loginStore } from "@/login/login.svelte"
  import { LogOutIcon } from "@lucide/svelte"

  const handleLogout = () => {
    logout()
  }
</script>

<button class="btn size-fit p-1 btn-error" onclick={handleLogout} disabled={!loginStore.token}>
  <LogOutIcon size={16} />
</button>
