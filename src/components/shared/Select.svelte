<script lang="ts" generics="T extends SelectableItem">
  import { buildIdTree, type IdTreeNode, type SelectableItem } from "@/utils/utils"
  import { ChevronRightIcon } from "@lucide/svelte"
  import type { Snippet } from "svelte"
  import type { ClassValue } from "svelte/elements"

  interface Props {
    class?: ClassValue
    children: Snippet<[T]>
    items: T[]
    ariaLabel: string
    isTree?: boolean
  }

  let { class: className, items, children, ariaLabel, isTree = false }: Props = $props()

  const tree = $derived(buildIdTree(items))
  const itemMap = $derived(new Map(items.map((item) => [item.id, item])))

  function setAll(checked: boolean) {
    for (const item of items) item.checked = checked
  }

  function handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
      e.preventDefault()
      setAll(true)
    } else if (e.key === "Escape") {
      setAll(false)
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div
  class={["list relative h-full scrollbar-thin overflow-y-auto rounded-b-box", className]}
  role="group"
  aria-label={ariaLabel}
  onkeydown={handleKeydown}
>
  {#if isTree}
    {@render branch(tree)}
  {:else}
    {#each items as item (item.id)}
      <div class="flex items-center has-checked:bg-accent">
        {@render field(item)}
      </div>
    {/each}
  {/if}
</div>

{#snippet field(item: T)}
  <label class="relative flex min-w-0 flex-1 cursor-pointer select-none has-focus-visible:outline">
    <input class="sr-only" type="checkbox" bind:checked={item.checked} />
    {@render children(item)}
  </label>
{/snippet}

{#snippet branch(nodes: IdTreeNode[], indent = 0)}
  {#each nodes as node (node.id)}
    {const item = itemMap.get(node.id)!}
    {const hasChildren = node.children.length > 0}
    {let collapsed = $state(false)}

    <div class="flex items-center has-checked:bg-accent" style:padding-left="{indent}rem">
      <span class="flex w-4 shrink-0 items-center justify-center">
        {#if hasChildren}
          <button
            type="button"
            class={[
              "cursor-pointer text-xs transition-transform select-none focus-visible:outline",
              { "rotate-90": !collapsed },
            ]}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand" : "Collapse"}
            onclick={() => (collapsed = !collapsed)}
          >
            <ChevronRightIcon class="size-4" />
          </button>
        {/if}
      </span>

      {@render field(item)}
    </div>

    {#if hasChildren && !collapsed}
      {@render branch(node.children, indent + 1)}
    {/if}
  {/each}
{/snippet}
