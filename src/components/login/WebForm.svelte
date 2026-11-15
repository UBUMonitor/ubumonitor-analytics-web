<script lang="ts">
  import PasswordInput from "@/components/shared/PasswordInput.svelte"
  import { getErrorMessage } from "@/error/errors"
  import { m } from "@/paraglide/messages"
  import { webLogin } from "@/services/login"
  import { CircleXIcon, DatabaseIcon } from "@lucide/svelte"
  import { onMount } from "svelte"
  import type { EventHandler } from "svelte/elements"

  interface Props {
    host: string
    launchUrl: string
  }

  let { host, launchUrl }: Props = $props()

  let loading = $state(false)
  let errorLogin = $state<string | null>()

  let dbPasswordInput = $state<HTMLInputElement>()

  const handleSubmit: EventHandler<SubmitEvent, HTMLFormElement> = async (event) => {
    try {
      event.preventDefault()
      loading = true
      errorLogin = null

      const dbPassword = event.currentTarget.dbPassword.value as string

      await webLogin(host, dbPassword, launchUrl)
    } catch (e) {
      errorLogin = getErrorMessage(e)
    } finally {
      loading = false
    }
  }

  onMount(() => {
    dbPasswordInput?.focus()
  })
</script>

<form class="fieldset" onsubmit={handleSubmit}>
  <PasswordInput
    bind:inputElement={dbPasswordInput}
    name="dbPassword"
    placeholder={m.database_password()}
    showLabel={m.show_database_password()}
    hideLabel={m.hide_database_password()}
  >
    <DatabaseIcon />
  </PasswordInput>

  <button class="btn mt-2 btn-primary" disabled={loading}>
    {#if loading}
      <span class="loading loading-spinner"></span>
    {:else}
      {m.login_sso()}
    {/if}
  </button>

  {#if errorLogin}
    <div role="alert" class="alert alert-error">
      <CircleXIcon />
      <span>{errorLogin}</span>
    </div>
  {/if}
</form>
