<script lang="ts">
  interface Props {
    name: string
  }

  const { name }: Props = $props()
</script>

<div class="flex h-8 items-center p-1">
  <span class="w-full truncate">{name}</span>
</div>
