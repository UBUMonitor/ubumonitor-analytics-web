<script lang="ts">
  import { loginWeb } from "@/login"
  import { m } from "@/paraglide/messages"
  import { DatabaseIcon } from "@lucide/svelte"
  import type { EventHandler } from "svelte/elements"

  interface Props {
    host: string
    launchUrl: string
  }

  let { host, launchUrl }: Props = $props()

  let loading = $state(false)

  const handleSubmit: EventHandler<SubmitEvent, HTMLFormElement> = async (event) => {
    try {
      event.preventDefault()
      loading = true

      const dbPassword = event.currentTarget.dbPassword.value as string

      await loginWeb(host, dbPassword, launchUrl)
    } finally {
      loading = false
    }
  }
</script>

<form class="fieldset" onsubmit={handleSubmit}>
  <label class="input w-full">
    <DatabaseIcon />
    <input type="password" name="dbPassword" placeholder={m.db_password_label()} required />
  </label>

  <button class="btn mt-2 btn-primary" disabled={loading}>
    {#if loading}
      <span class="loading loading-spinner"></span>
    {:else}
      {m.login_sso_button()}
    {/if}
  </button>
</form>
