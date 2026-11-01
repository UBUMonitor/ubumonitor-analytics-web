<script lang="ts" generics="T extends SelectableItem">
  import type { SelectableItem } from "@/shared/types/selectable-item"
  import type { Snippet } from "svelte"

  interface Props {
    item: Snippet<[T]>
    items: T[]
    ariaLabel: string
    onToggle: (item: T, checked: boolean) => void
    onToggleAll: (items: T[], checked: boolean) => void
  }

  let { item, items, ariaLabel, onToggle, onToggleAll }: Props = $props()

  function isEditableTarget(target: EventTarget | null): boolean {
    return (
      (target instanceof HTMLInputElement && target.type !== "checkbox") ||
      target instanceof HTMLTextAreaElement ||
      (target instanceof HTMLElement && target.isContentEditable)
    )
  }

  function handleKeydown(e: KeyboardEvent) {
    if (isEditableTarget(e.target)) return

    if (e.ctrlKey && e.key === "a") {
      e.preventDefault()
      onToggleAll(items, true)
    } else if (e.key === "Escape") {
      onToggleAll(items, false)
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class="list h-full scrollbar-thin overflow-y-auto rounded-b-box"
  role="group"
  aria-label={ariaLabel}
  onkeydown={handleKeydown}
>
  {#each items as selectable (selectable.id)}
    <label
      class="cursor-pointer select-none has-checked:bg-accent has-focus-visible:outline has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary"
    >
      <input
        class="sr-only peer"
        type="checkbox"
        checked={selectable.checked}
        onchange={(event) => onToggle(selectable, event.currentTarget.checked)}
      />
      {@render item(selectable)}
    </label>
  {/each}
</div>
