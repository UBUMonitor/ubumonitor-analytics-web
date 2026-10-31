<script lang="ts">
  import { validateHost, type TypeOfLogin } from "@/login"
  import AppForm from "@/login/components/AppForm.svelte"
  import LocaleSelector from "@/login/components/LocaleSelector.svelte"
  import WebForm from "@/login/components/WebForm.svelte"
  import { m } from "@/shared/paraglide/messages.js"
  import { ArrowRightIcon, CircleXIcon, LinkIcon, SquarePenIcon } from "@lucide/svelte"
  import { onMount } from "svelte"

  let host = $state(localStorage.getItem("host") ?? "")
  let hostDisabled = $state(false)
  let checkingHost = $state(false)
  let errorHost = $state<string | null>(null)

  let typeOfLogin = $state<TypeOfLogin | null>(null)
  let launchUrl = $state<string | null | undefined>(null)

  let hostInput: HTMLInputElement

  const checkHost = async (host: string) => {
    try {
      checkingHost = true
      errorHost = null

      const result = await validateHost(host)

      if (!result.enableMobileWebService || !result.enableWebServices) {
        errorHost = m.host_unsupported_error()
        return
      }

      if (result.maintenanceEnabled) {
        errorHost = result.maintenanceMessage || m.host_maintenance_error()
        return
      }

      typeOfLogin = result.typeOfLogin
      launchUrl = result.launchUrl

      localStorage.setItem("host", host)

      hostDisabled = true
    } catch {
      errorHost = m.host_invalid_error()
    } finally {
      checkingHost = false
    }
  }

  const submitHost = async (event: SubmitEvent) => {
    event.preventDefault()

    if (hostDisabled) {
      hostDisabled = false
      typeOfLogin = null
      launchUrl = null
      return
    }

    await checkHost(host)
  }

  onMount(() => {
    if (host) checkHost(host)
    hostInput?.focus()
  })
</script>

<fieldset class="mx-auto mt-16 fieldset h-fit w-sm rounded-box bg-base-100 p-4 shadow">
  <LocaleSelector class="ml-auto" />
  <img class="m-auto size-52 object-contain" src="/logo.png" alt="UBUMonitor Logo" />

  <form class="join mb-2 w-full" onsubmit={submitHost}>
    <label class="input join-item w-full">
      <LinkIcon />
      <input
        bind:this={hostInput}
        type="url"
        name="host"
        aria-label={m.host()}
        placeholder={m.host()}
        required
        bind:value={host}
        disabled={hostDisabled || checkingHost}
      />
    </label>

    <button
      class="btn join-item btn-neutral"
      aria-label={hostDisabled ? m.edit_host() : m.check_host()}
      disabled={checkingHost}
    >
      {#if checkingHost}
        <span class="loading loading-spinner"></span>
      {:else if hostDisabled}
        <SquarePenIcon />
      {:else}
        <ArrowRightIcon />
      {/if}
    </button>
  </form>

  {#if errorHost}
    <div role="alert" class="alert alert-error">
      <CircleXIcon />
      <span>{errorHost}</span>
    </div>
  {/if}

  {#if typeOfLogin === "APP"}
    <AppForm {host} />
  {:else if launchUrl}
    <WebForm {host} {launchUrl} />
  {/if}
</fieldset>
