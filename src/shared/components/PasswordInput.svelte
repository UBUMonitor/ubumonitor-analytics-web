<script lang="ts">
  import { EyeIcon, EyeOffIcon } from "@lucide/svelte"
  import type { Snippet } from "svelte"
  import type { HTMLInputAttributes } from "svelte/elements"

  interface Props extends Omit<HTMLInputAttributes, "name" | "placeholder" | "required" | "type"> {
    name: string
    placeholder: string
    showLabel: string
    hideLabel: string
    required?: boolean
    icon: Snippet
  }

  let { name, placeholder, showLabel, hideLabel, required = true, icon, ...rest }: Props = $props()

  let showPassword = $state(false)
</script>

<label class="input w-full">
  {@render icon()}
  <input {...rest} type={showPassword ? "text" : "password"} {name} {placeholder} {required} />
  <button
    type="button"
    tabindex="-1"
    class="btn btn-circle btn-ghost btn-xs"
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
