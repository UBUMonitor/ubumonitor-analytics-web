<script lang="ts">
  import UpdateDialog from "@/app/UpdateDialog.svelte"
  import Dialog from "@/dialog/components/Dialog.svelte"
  import { openDialog } from "@/dialog/dialog.svelte"
  import Login from "@/login/components/Login.svelte"
  import { loginStore } from "@/login/login.svelte"
  import { check } from "@tauri-apps/plugin-updater"
  import { onMount } from "svelte"

  const dashboard = import("@/dashboard/components/Dashboard.svelte")

  onMount(() => {
    check().then((update) => update && openDialog(UpdateDialog, { update }))
  })
</script>

{#if !loginStore.userId}
  <Login />
{:else}
  {#await dashboard then { default: Dashboard }}
    <Dashboard />
  {/await}
{/if}
<Dialog />
