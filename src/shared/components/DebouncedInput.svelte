<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements"

  interface Props extends Omit<HTMLInputAttributes, "value" | "onchange"> {
    value: string | number
    onchange: (value: string | number) => void
    debounce?: number
  }

  let { value, onchange, debounce = 500, ...rest }: Props = $props()

  // Writable derived: follows `value` from the parent, but can be
  // overwritten locally by the input binding until `value` changes again.
  let internalValue = $derived(value)

  let timeout: ReturnType<typeof setTimeout> | undefined

  function schedule() {
    clearTimeout(timeout)
    timeout = setTimeout(() => onchange(internalValue), debounce)
  }

  function flush() {
    if (timeout === undefined) return
    clearTimeout(timeout)
    timeout = undefined
    onchange(internalValue)
  }

  // Cleanup on unmount
  $effect(() => () => clearTimeout(timeout))
</script>

<input {...rest} bind:value={internalValue} oninput={schedule} onblur={flush} />
