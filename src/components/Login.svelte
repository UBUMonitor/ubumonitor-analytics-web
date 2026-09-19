<script lang="ts">
  import {
    clearHost,
    clearUsername,
    getHost,
    getUsername,
    setHost,
    setUsername,
  } from "@/lib/localStore.svelte"
  import { login, syncCourses } from "@/lib/moodle"
  import { m } from "@/paraglide/messages.js"
  import { DatabaseIcon, KeyRoundIcon, LinkIcon, UserIcon } from "@lucide/svelte"

  let loading = $state(false)

  const handleSubmit = async (event: Event) => {
    event.preventDefault()
    loading = true

    try {
      const form = new FormData(event.target as HTMLFormElement)

      const username = form.get("username") as string
      const password = form.get("password") as string
      const dbPassword = form.get("dbPassword") as string
      const host = form.get("host") as string

      const rememberUsername = form.get("rememberUsername")
      const rememberHost = form.get("rememberHost")

      await login(username, password, dbPassword, host)

      if (rememberUsername) {
        setUsername(username)
      } else {
        clearUsername()
      }

      if (rememberHost) {
        setHost(host)
      } else {
        clearHost()
      }

      await syncCourses()
    } finally {
      loading = false
    }
  }
</script>

<form
  class="fieldset w-sm rounded-box border border-base-300 bg-base-200 p-4"
  onsubmit={handleSubmit}
>
  <img class="m-auto size-52 object-contain" src="/logo.png" alt="UBUMonitor Logo" />
  <label class="input w-full">
    <UserIcon />
    <input
      type="text"
      name="username"
      placeholder={m.username_label()}
      required
      value={getUsername()}
    />
  </label>

  <label class="input w-full">
    <KeyRoundIcon />
    <input type="password" name="password" placeholder={m.password_label()} required />
  </label>

  <label class="input w-full">
    <DatabaseIcon />
    <input type="password" name="dbPassword" placeholder={m.db_password_label()} required />
  </label>

  <label class="input w-full">
    <LinkIcon />
    <input type="url" name="host" placeholder={m.host_label()} required value={getHost()} />
  </label>

  <fieldset class="m-auto mt-2 flex gap-4">
    <label class="label">
      <input type="checkbox" class="checkbox" name="rememberUsername" checked={!!getUsername()} />
      <span>{m.remember_username_label()}</span>
    </label>
    <label class="label">
      <input type="checkbox" class="checkbox" name="rememberHost" checked={!!getHost()} />
      <span>{m.remember_host_label()}</span>
    </label>
  </fieldset>

  <button class="btn mt-4 btn-primary" disabled={loading}>
    {#if loading}
      <span class="loading loading-spinner"></span>
    {:else}
      {m.login_button()}
    {/if}
  </button>
</form>
