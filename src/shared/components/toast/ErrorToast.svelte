<script lang="ts">
  import { m } from "@/shared/paraglide/messages"
  import { XIcon } from "@lucide/svelte"

  interface Props {
    message: string
    closeToast: () => void
  }

  let { message, closeToast }: Props = $props()
</script>

<div role="alert" class="alert flex w-80 items-start alert-error shadow-lg">
  <span class="min-w-0 flex-1 wrap-break-word">{message}</span>
  <button
    type="button"
    class="btn btn-ghost btn-xs btn-square ml-auto shrink-0"
    aria-label={m.close()}
    onclick={closeToast}
  >
    <XIcon class="size-4" />
  </button>
</div>
