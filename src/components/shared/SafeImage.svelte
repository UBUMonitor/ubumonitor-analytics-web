<script lang="ts">
  import { CircleXIcon } from "@lucide/svelte"
  import type { ClassValue } from "svelte/elements"

  interface Props {
    class?: ClassValue
    src: string
    alt: string
  }

  let { class: className, src, alt }: Props = $props()

  let failed = $state(false)

  // Reset the error state when the src changes
  $effect(() => {
    void src
    failed = false
  })
</script>

{#if failed}
  <CircleXIcon class={["p-0.5 text-error", className]} />
{:else}
  <img class={className} {src} {alt} onerror={() => (failed = true)} />
{/if}
