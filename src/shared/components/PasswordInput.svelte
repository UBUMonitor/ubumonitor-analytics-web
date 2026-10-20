<script lang="ts">
  import { EyeIcon, EyeOffIcon } from "@lucide/svelte"
  import type { Snippet } from "svelte"

  interface Props {
    name: string
    placeholder: string
    showLabel: string
    hideLabel: string
    inputElement?: HTMLInputElement
    children: Snippet
  }

  let {
    name,
    placeholder,
    showLabel,
    hideLabel,
    inputElement = $bindable(),
    children,
  }: Props = $props()

  let showPassword = $state(false)
</script>

<label class="input w-full">
  {@render children()}
  <input
    bind:this={inputElement}
    type={showPassword ? "text" : "password"}
    {name}
    {placeholder}
    required
  />
  <button
    type="button"
    tabindex="-1"
    class="btn btn-ghost btn-circle btn-xs"
    aria-label={showPassword ? hideLabel : showLabel}
    onclick={() => (showPassword = !showPassword)}
  >
    {#if showPassword}
      <EyeOffIcon />
    {:else}
      <EyeIcon />
    {/if}
  </button>
</label>
