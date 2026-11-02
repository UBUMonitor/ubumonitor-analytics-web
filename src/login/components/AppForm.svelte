<script lang="ts">
  import { appLogin, login } from "@/login"
  import PasswordInput from "@/shared/components/PasswordInput.svelte"
  import { AsyncAction } from "@/shared/lib/async.svelte"
  import { getFormString } from "@/shared/lib/form"
  import { readStorageItem, writeStorageItem } from "@/shared/lib/storage"
  import { m } from "@/shared/paraglide/messages"
  import { DatabaseIcon, KeyRoundIcon, UserIcon } from "@lucide/svelte"
  import { warn } from "@tauri-apps/plugin-log"
  import { untrack } from "svelte"
  import type { Attachment } from "svelte/attachments"
  import type { EventHandler } from "svelte/elements"

  interface Props {
    host: string
  }

  let { host }: Props = $props()
  const usernameResult = untrack(() => readStorageItem(`username:${host}`))
  if (!usernameResult.ok) void warn("Failed to read the saved username from local storage")
  const savedUsername = usernameResult.ok ? (usernameResult.value ?? "") : ""
  const action = new AsyncAction()

  const focusInitialField: Attachment<HTMLFormElement> = (form) => {
    const selector = savedUsername ? 'input[name="password"]' : 'input[name="username"]'
    form.querySelector<HTMLInputElement>(selector)?.focus()
  }

  const handleSubmit: EventHandler<SubmitEvent, HTMLFormElement> = async (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const username = getFormString(formData, "username")
    const password = getFormString(formData, "password")
    const dbPassword = getFormString(formData, "dbPassword")

    await action.run(async () => {
      await login(appLogin(username, password, dbPassword, host))

      const storageResult = writeStorageItem(`username:${host}`, username)
      if (!storageResult.ok) void warn("Failed to save the username to local storage")
    })
  }
</script>

<form class="fieldset" onsubmit={handleSubmit} {@attach focusInitialField}>
  <label class="input w-full">
    <UserIcon />
    <input type="text" name="username" placeholder={m.username()} value={savedUsername} required />
  </label>

  <PasswordInput
    name="password"
    placeholder={m.password()}
    showLabel={m.show_password()}
    hideLabel={m.hide_password()}
  >
    {#snippet icon()}
      <KeyRoundIcon />
    {/snippet}
  </PasswordInput>

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
      {m.login()}
    {/if}
  </button>
</form>
