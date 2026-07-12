<script lang="ts">
  import { m } from "@/paraglide/messages"
  import { invoke } from "@tauri-apps/api/core"
  import { listen, type UnlistenFn } from "@tauri-apps/api/event"
  import { onMount } from "svelte"

  interface ProgressPayload {
    percent: number
    finished: boolean
    error: string | null
  }

  // eslint-disable-next-line no-useless-assignment
  let { done = $bindable() } = $props()

  let progress: ProgressPayload = $state<ProgressPayload>({
    percent: 0,
    finished: false,
    error: null,
  })

  onMount(() => {
    let unlisten: UnlistenFn

    listen<ProgressPayload>("download-progress", (event) => {
      progress = event.payload
      if (progress.finished) {
        done = true
      }
    }).then((fn) => {
      unlisten = fn
    })

    invoke("prepare_and_launch").catch((e) => {
      console.error(e)
    })

    return () => {
      unlisten?.()
    }
  })
</script>

<div class="card w-96 bg-base-200 shadow-sm card-lg">
  <div class="card-body">
    <h1 class="card-title">{m.preparing_application_label()}</h1>
    <div class="flex flex-col items-start gap-3">
      <progress
        class="progress w-72 {progress.error ? 'progress-error' : 'progress-primary'}"
        value={progress.percent}
        max="100"
      ></progress>

      {#if progress.error}
        <p class="text-sm text-error">{progress.error}</p>
      {/if}
    </div>
  </div>
</div>
