<script lang="ts">
  import { appLogin } from "@/login"
  import PasswordInput from "@/shared/components/PasswordInput.svelte"
  import { getErrorMessage } from "@/shared/error/errorMessage"
  import { m } from "@/shared/paraglide/messages"
  import { CircleXIcon, DatabaseIcon, KeyRoundIcon, UserIcon } from "@lucide/svelte"
  import { onMount } from "svelte"
  import type { EventHandler } from "svelte/elements"

  interface Props {
    host: string
  }

  let { host }: Props = $props()
  let loading = $state(false)
  let errorLogin = $state<string | null>()

  let username = $derived(localStorage.getItem(`username:${host}`) ?? "")

  let usernameInput = $state<HTMLInputElement>()
  let passwordInput = $state<HTMLInputElement>()

  const handleSubmit: EventHandler<SubmitEvent, HTMLFormElement> = async (event) => {
    try {
      event.preventDefault()
      loading = true
      errorLogin = null

      username = event.currentTarget.username.value as string
      const password = event.currentTarget.password.value as string
      const dbPassword = event.currentTarget.dbPassword.value as string

      await appLogin(username, password, dbPassword, host)

      localStorage.setItem(`username:${host}`, username)
    } catch (e) {
      errorLogin = getErrorMessage(e)
    } finally {
      loading = false
    }
  }

  onMount(() => {
    if (username) {
      passwordInput?.focus()
    } else {
      usernameInput?.focus()
    }
  })
</script>

<form class="fieldset" onsubmit={handleSubmit}>
  <label class="input w-full">
    <UserIcon />
    <input
      bind:this={usernameInput}
      bind:value={username}
      type="text"
      name="username"
      placeholder={m.username_label()}
      required
    />
  </label>

  <PasswordInput
    bind:inputElement={passwordInput}
    name="password"
    placeholder={m.password_label()}
    showLabel={m.show_password_button()}
    hideLabel={m.hide_password_button()}
  >
    <KeyRoundIcon />
  </PasswordInput>

  <PasswordInput
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
      {m.login_button()}
    {/if}
  </button>

  {#if errorLogin}
    <div role="alert" class="alert alert-error">
      <CircleXIcon />
      <span>{errorLogin}</span>
    </div>
  {/if}
</form>
