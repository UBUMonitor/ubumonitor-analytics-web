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
  let timeout: ReturnType<typeof setTimeout> | undefined
  let pendingValue: string | undefined

  function schedule(nextValue: string) {
    clearTimeout(timeout)
    pendingValue = nextValue
    timeout = setTimeout(() => {
      timeout = undefined
      onchange(nextValue)
    }, debounce)
  }

  function flush() {
    if (timeout === undefined) return
    clearTimeout(timeout)
    timeout = undefined
    if (pendingValue !== undefined) onchange(pendingValue)
  }

  $effect(() => () => clearTimeout(timeout))
</script>

<input {...rest} {value} oninput={(event) => schedule(event.currentTarget.value)} onblur={flush} />
