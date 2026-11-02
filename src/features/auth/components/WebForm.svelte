<script lang="ts">
  import { login, loginWeb } from "@/features/auth/auth"
  import { queryClient } from "@/shared/api/queryClient"
  import PasswordInput from "@/shared/components/PasswordInput.svelte"
  import { getFormString } from "@/shared/lib/form"
  import { m } from "@/shared/paraglide/messages"
  import { DatabaseIcon } from "@lucide/svelte"
  import { createMutation } from "@tanstack/svelte-query"
  import type { Attachment } from "svelte/attachments"
  import type { EventHandler } from "svelte/elements"

  interface Props {
    host: string
    launchUrl: string
  }

  let { host, launchUrl }: Props = $props()
  const action = createMutation(
    () => ({
      mutationKey: ["auth", "web-login"],
      mutationFn: async ({ dbPassword }: { dbPassword: string }) => {
        await login(loginWeb(host, dbPassword, launchUrl))
      },
    }),
    () => queryClient,
  )

  const focusPassword: Attachment<HTMLFormElement> = (form) => {
    form.querySelector<HTMLInputElement>('input[name="dbPassword"]')?.focus()
  }

  const handleSubmit: EventHandler<SubmitEvent, HTMLFormElement> = async (event) => {
    event.preventDefault()
    const dbPassword = getFormString(new FormData(event.currentTarget), "dbPassword")

    action.mutate({ dbPassword })
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

  <button class="btn mt-2 btn-primary" disabled={action.isPending}>
    {#if action.isPending}
      <span class="loading loading-spinner"></span>
    {:else}
      {m.login_sso()}
    {/if}
  </button>
</form>
