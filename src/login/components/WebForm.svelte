<script lang="ts">
  import { login, loginWeb } from "@/login"
  import PasswordInput from "@/shared/components/PasswordInput.svelte"
  import { AsyncAction } from "@/shared/lib/async.svelte"
  import { getFormString } from "@/shared/lib/form"
  import { m } from "@/shared/paraglide/messages"
  import { DatabaseIcon } from "@lucide/svelte"
  import type { Attachment } from "svelte/attachments"
  import type { EventHandler } from "svelte/elements"

  interface Props {
    host: string
    launchUrl: string
  }

  let { host, launchUrl }: Props = $props()
  const action = new AsyncAction()

  const focusPassword: Attachment<HTMLFormElement> = (form) => {
    form.querySelector<HTMLInputElement>('input[name="dbPassword"]')?.focus()
  }

  const handleSubmit: EventHandler<SubmitEvent, HTMLFormElement> = async (event) => {
    event.preventDefault()
    const dbPassword = getFormString(new FormData(event.currentTarget), "dbPassword")

    await action.run(() => login(loginWeb(host, dbPassword, launchUrl)))
  }
</script>

<form class="fieldset" onsubmit={handleSubmit} {@attach focusPassword}>
  <PasswordInput
    name="dbPassword"
    placeholder={m.database_password()}
    showLabel={m.show_database_password()}
    hideLabel={m.hide_database_password()}
  >
    {#snippet icon()}
      <DatabaseIcon />
    {/snippet}
  </PasswordInput>

  <button class="btn mt-2 btn-primary" disabled={action.loading}>
    {#if action.loading}
      <span class="loading loading-spinner"></span>
    {:else}
      {m.login_sso()}
    {/if}
  </button>
</form>
