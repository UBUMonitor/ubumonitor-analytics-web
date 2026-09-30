<script lang="ts">
  import { SiteInfoTypeOfLogin } from "@/backend/model"
  import { validateHost } from "@/login"
  import AppForm from "@/login/AppForm.svelte"
  import LocaleSelector from "@/login/LocaleSelector.svelte"
  import WebForm from "@/login/WebForm.svelte"
  import { m } from "@/paraglide/messages.js"
  import { ArrowRightIcon, LinkIcon, SquarePenIcon } from "@lucide/svelte"
  import { onMount } from "svelte"

  const storedHost = localStorage.getItem("host") ?? ""

  let host = $state(storedHost)
  let hostDisabled = $state(storedHost !== "")
  let checkingHost = $state(false)

  let typeOfLogin = $state<SiteInfoTypeOfLogin | null>(null)
  let launchUrl = $state<string | null | undefined>(null)

  const checkHost = async (host: string) => {
    try {
      checkingHost = true
      const result = await validateHost(host)
      typeOfLogin = result.typeOfLogin
      launchUrl = result.launchUrl
      hostDisabled = true
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
    if (typeOfLogin) localStorage.setItem("host", host)
  }

  onMount(() => {
    if (host) checkHost(host)
  })
</script>

<fieldset class="fieldset mx-auto mt-16 w-sm h-fit rounded-box shadow bg-base-300 p-4">
  <LocaleSelector class="ml-auto" />
  <img class="m-auto size-52 object-contain" src="/logo.png" alt="UBUMonitor Logo" />

  <form class="join w-full mb-2" onsubmit={submitHost}>
    <label class="input w-full join-item">
      <LinkIcon />
      <input
        type="url"
        name="host"
        placeholder={m.host_label()}
        required
        bind:value={host}
        disabled={hostDisabled}
      />
    </label>

    <button class="btn join-item btn-neutral" disabled={checkingHost}>
      {#if checkingHost}
        <span class="loading loading-spinner"></span>
      {:else if hostDisabled}
        <SquarePenIcon />
      {:else}
        <ArrowRightIcon />
      {/if}
    </button>
  </form>

  {#if typeOfLogin === SiteInfoTypeOfLogin.APP}
    <AppForm {host} />
  {:else if typeOfLogin != null && launchUrl}
    <WebForm {host} {launchUrl} />
  {/if}
</fieldset>
