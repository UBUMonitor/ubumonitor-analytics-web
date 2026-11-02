<script lang="ts">
  import UpdateDialog from "@/app/UpdateDialog.svelte"
  import Dialog from "@/dialog/components/Dialog.svelte"
  import { dialog } from "@/dialog/dialog.svelte"
  import Login from "@/login/components/Login.svelte"
  import { loginStore } from "@/login/login.svelte"
  import { notifyError } from "@/shared/lib/notify"
  import { check } from "@tauri-apps/plugin-updater"
  import { Toaster } from "svelte-sonner"

  const dashboard = import("@/dashboard/components/Dashboard.svelte")

  const initialize = async () => {
    try {
      const update = await check()
      if (update) dialog.open(UpdateDialog, { update })
    } catch (error) {
      notifyError(error)
    }
  }
  void initialize()
</script>

{#if !loginStore.token}
  <Login />
{:else}
  {#await dashboard then { default: Dashboard }}
    <Dashboard />
  {/await}
{/if}
<Dialog />
<Toaster position="top-right" visibleToasts={1} />
