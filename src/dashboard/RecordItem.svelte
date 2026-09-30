<script lang="ts">
  interface Props {
    name?: string
    modName?: string
  }

  const { name, modName }: Props = $props()
</script>

<div class="flex h-8 items-center gap-1 p-1">
  {#if modName}
    <img class="h-full" src="/icons/{modName}.svg" alt={modName} />
  {/if}
  <span class="w-full truncate">{name}</span>
</div>
