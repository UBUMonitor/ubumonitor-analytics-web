<script lang="ts">
  import { logout } from "@/login"
  import { loginStore } from "@/login/login.svelte"
  import { m } from "@/shared/paraglide/messages"
  import { LogOutIcon } from "@lucide/svelte"

  const handleLogout = () => {
    logout()
  }
</script>

<button
  class="btn size-fit p-1 btn-error"
  onclick={handleLogout}
  disabled={!loginStore.token}
  aria-label={m.logout_label()}
  title={m.logout_label()}
>
  <LogOutIcon size={16} />
</button>
