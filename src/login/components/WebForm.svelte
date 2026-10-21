<script lang="ts">
  import { loginWeb } from "@/login"
  import PasswordInput from "@/shared/components/PasswordInput.svelte"
  import { getErrorMessage } from "@/shared/error/errorMessage"
  import { m } from "@/shared/paraglide/messages"
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

      await loginWeb(host, dbPassword, launchUrl)
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
    placeholder={m.db_password_label()}
    showLabel={m.show_database_password_button()}
    hideLabel={m.hide_database_password_button()}
  >
    <DatabaseIcon />
  </PasswordInput>

  <button class="btn mt-2 btn-primary" disabled={loading}>
    {#if loading}
      <span class="loading loading-spinner"></span>
    {:else}
      {m.login_sso_button()}
    {/if}
  </button>

  {#if errorLogin}
    <div role="alert" class="alert alert-error">
      <CircleXIcon />
      <span>{errorLogin}</span>
    </div>
  {/if}
</form>
