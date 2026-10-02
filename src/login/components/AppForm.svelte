<script lang="ts">
  import { appLogin } from "@/login"
  import { m } from "@/shared/paraglide/messages"
  import { DatabaseIcon, KeyRoundIcon, UserIcon } from "@lucide/svelte"
  import type { EventHandler } from "svelte/elements"

  interface Props {
    host: string
  }

  let { host }: Props = $props()
  let loading = $state(false)

  const handleSubmit: EventHandler<SubmitEvent, HTMLFormElement> = async (event) => {
    try {
      event.preventDefault()
      loading = true

      const username = event.currentTarget.username.value as string
      const password = event.currentTarget.password.value as string
      const dbPassword = event.currentTarget.dbPassword.value as string

      await appLogin(username, password, dbPassword, host)
    } finally {
      loading = false
    }
  }
</script>

<form class="fieldset" onsubmit={handleSubmit}>
  <label class="input w-full">
    <UserIcon />
    <input type="text" name="username" placeholder={m.username_label()} required />
  </label>

  <label class="input w-full">
    <KeyRoundIcon />
    <input type="password" name="password" placeholder={m.password_label()} required />
  </label>

  <label class="input w-full">
    <DatabaseIcon />
    <input type="password" name="dbPassword" placeholder={m.db_password_label()} required />
  </label>

  <button class="btn mt-2 btn-primary" disabled={loading}>
    {#if loading}
      <span class="loading loading-spinner"></span>
    {:else}
      {m.login_button()}
    {/if}
  </button>
</form>
