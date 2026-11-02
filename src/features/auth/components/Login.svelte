<script lang="ts">
  import { validateHost, type TypeOfLogin } from "@/features/auth/auth"
  import AppForm from "@/features/auth/components/AppForm.svelte"
  import LocaleSelector from "@/features/auth/components/LocaleSelector.svelte"
  import WebForm from "@/features/auth/components/WebForm.svelte"
  import { notifyError } from "@/shared/lib/notify"
  import { settingsStore } from "@/shared/lib/settings.svelte"
  import { m } from "@/shared/paraglide/messages.js"
  import { ArrowRightIcon, LinkIcon, SquarePenIcon } from "@lucide/svelte"
  import { untrack } from "svelte"
  import type { Attachment } from "svelte/attachments"

  type HostState =
    | { status: "idle" }
    | { status: "checking" }
    | { status: "ready"; typeOfLogin: TypeOfLogin; launchUrl?: string }

  let host = $state(settingsStore.get("host"))
  let hostState = $state<HostState>({ status: "idle" })

  const checkingHost = $derived(hostState.status === "checking")
  const hostDisabled = $derived(hostState.status === "ready")
  const typeOfLogin = $derived(hostState.status === "ready" ? hostState.typeOfLogin : null)
  const launchUrl = $derived(hostState.status === "ready" ? hostState.launchUrl : undefined)

  const focusHost: Attachment<HTMLInputElement> = (input) => input.focus()

  const checkHost = async (value: string) => {
    hostState = { status: "checking" }

    try {
      const result = await validateHost(value)

      if (!result.enableMobileWebService || !result.enableWebServices) {
        notifyError(m.host_unsupported_error())
        hostState = { status: "idle" }
        return
      }

      if (result.maintenanceEnabled) {
        notifyError(result.maintenanceMessage || m.host_maintenance_error())
        hostState = { status: "idle" }
        return
      }

      hostState = {
        status: "ready",
        typeOfLogin: result.typeOfLogin,
        launchUrl: result.launchUrl,
      }
      await settingsStore.set("host", value)
    } catch {
      notifyError(m.host_invalid_error())
      hostState = { status: "idle" }
    }
  }

  const submitHost = async (event: SubmitEvent) => {
    event.preventDefault()

    if (hostDisabled) {
      hostState = { status: "idle" }
      return
    }

    await checkHost(host)
  }

  untrack(() => {
    if (host) void checkHost(host)
  })
</script>

<fieldset class="mx-auto mt-16 fieldset h-fit w-sm rounded-box bg-base-100 p-4 shadow">
  <LocaleSelector class="ml-auto" />
  <img class="m-auto size-52 object-contain" src="/logo.png" alt="UBUMonitor Logo" />

  <form class="join mb-2 w-full" onsubmit={submitHost}>
    <label class="input join-item w-full">
      <LinkIcon />
      <input
        type="url"
        name="host"
        aria-label={m.host()}
        placeholder={m.host()}
        required
        value={host}
        oninput={(event) => (host = event.currentTarget.value)}
        disabled={hostDisabled || checkingHost}
        {@attach focusHost}
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

  {#if typeOfLogin === "APP"}
    <AppForm {host} />
  {:else if launchUrl}
    <WebForm {host} {launchUrl} />
  {/if}
</fieldset>
