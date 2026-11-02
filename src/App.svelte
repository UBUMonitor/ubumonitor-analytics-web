<script lang="ts">
  import Login from "@/features/auth/components/Login.svelte"
  import { loginStore } from "@/features/auth/login.svelte"
  import BackendErrorDialog from "@/features/backend/components/BackendErrorDialog.svelte"
  import UpdateDialog from "@/features/updater/UpdateDialog.svelte"
  import { setApiBaseUrl } from "@/shared/api/config"
  import Dialog from "@/shared/components/dialog/Dialog.svelte"
  import { dialog } from "@/shared/components/dialog/dialog-state.svelte"
  import { notifyError } from "@/shared/lib/notify"
  import { m } from "@/shared/paraglide/messages"
  import type { QueryClient } from "@tanstack/svelte-query"
  import { QueryClientProvider } from "@tanstack/svelte-query"
  import { invoke } from "@tauri-apps/api/core"
  import { listen, type UnlistenFn } from "@tauri-apps/api/event"
  import { check } from "@tauri-apps/plugin-updater"
  import { onMount } from "svelte"
  import { Toaster } from "svelte-sonner"

  let { queryClient, settingsError }: { queryClient: QueryClient; settingsError?: unknown } =
    $props()
  let startupState = $state<"starting" | "ready" | "error">("starting")

  type SidecarStatus =
    | { status: "starting" }
    | { status: "ready"; apiBaseUrl: string }
    | { status: "error"; message: string }

  const dashboard = import("@/features/course/components/Dashboard.svelte")

  const initialize = async () => {
    try {
      const update = await check()
      if (update) dialog.open(UpdateDialog, { update })
    } catch (error) {
      notifyError(error)
    }
  }

  const updateStartupState = (status: SidecarStatus) => {
    if (status.status === "ready") {
      if (startupState === "ready") return
      setApiBaseUrl(status.apiBaseUrl)
      startupState = "ready"
      void initialize()
    } else if (status.status === "error" && startupState !== "error") {
      startupState = "error"
      dialog.open(BackendErrorDialog)
    }
  }

  onMount(() => {
    if (settingsError) notifyError(settingsError)

    let disposed = false
    let unlistenReady: UnlistenFn | undefined
    let unlistenError: UnlistenFn | undefined

    void (async () => {
      unlistenReady = await listen<SidecarStatus>("sidecar-ready", ({ payload }) => {
        updateStartupState(payload)
      })
      unlistenError = await listen<SidecarStatus>("sidecar-error", ({ payload }) => {
        updateStartupState(payload)
      })
      const status = await invoke<SidecarStatus>("sidecar_status")
      if (!disposed) updateStartupState(status)
    })().catch((error: unknown) => {
      if (disposed) return
      startupState = "error"
      dialog.open(BackendErrorDialog)
      notifyError(error)
    })

    return () => {
      disposed = true
      unlistenReady?.()
      unlistenError?.()
    }
  })
</script>

<QueryClientProvider client={queryClient}>
  {#if startupState === "starting"}
    <main class="flex size-full items-center justify-center gap-3">
      <span class="loading loading-spinner" aria-hidden="true"></span>
      <span>{m.backend_starting()}</span>
    </main>
  {:else if startupState === "ready" && !loginStore.token}
    <Login />
  {:else if startupState === "ready"}
    {#await dashboard then { default: Dashboard }}
      <Dashboard />
    {/await}
  {:else}
    <main class="size-full"></main>
  {/if}
  <Dialog />
  <Toaster position="top-right" visibleToasts={1} />
</QueryClientProvider>
