<div class="flex flex-col animate-pulse overflow-hidden">
  {#each { length: 5 }, i (i)}
    <div class="flex h-14 gap-2">
      <div class="skeleton m-1 rounded-box aspect-square h-12 shrink-0"></div>
      <div class="flex flex-col gap-1 justify-center">
        <div class="skeleton h-4 w-20"></div>
        <div class="skeleton h-3 w-36"></div>
        <div class="skeleton h-3 w-36"></div>
      </div>
    </div>
  {/each}
</div>
