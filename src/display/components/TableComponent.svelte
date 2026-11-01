<script lang="ts">
  import { renderValue, type DynamicRow, features, type TableOption } from "@/display/impl/table"
  import DebouncedInput from "@/shared/components/DebouncedInput.svelte"
  import { m } from "@/shared/paraglide/messages"
  import { createTable, FlexRender, type ColumnDef } from "@tanstack/svelte-table"
  import { createVirtualizer } from "@tanstack/svelte-virtual"
  import { untrack } from "svelte"
  import { get } from "svelte/store"

  interface Props {
    option: TableOption
  }

  let { option }: Props = $props()
  let scrollElement: HTMLDivElement | undefined = $state(undefined)

  const columns = $derived.by<Array<ColumnDef<typeof features, DynamicRow>>>(() => {
    if (option.columns.length === 0) return []

    return option.columns.map((column): ColumnDef<typeof features, DynamicRow> => {
      const dataType = column.type

      return {
        accessorKey: column.key,
        header: column.name,
        enableColumnFilter: column.filter ?? false,
        meta: { dataType, width: column.width },
        cell: (info) => renderValue(info.getValue(), dataType),
      }
    })
  })

  const table = createTable({
    features,
    get data() {
      return option.data
    },
    get columns() {
      return columns
    },
  })

  const rows = $derived(table.getRowModel().rows)

  // The adapter emits the same virtualizer instance, so derive directly from its store values.
  const virtualizerStore = createVirtualizer({
    get count() {
      return rows.length
    },
    getScrollElement: () => scrollElement ?? null,
    estimateSize: () => 46,
  })
  // The adapter spreads options and evaluates the count getter only once.
  const virtualRows = $derived($virtualizerStore.getVirtualItems())
  const totalSize = $derived($virtualizerStore.getTotalSize())
  let previousRows: typeof rows = []

  $effect.pre(() => {
    const currentRows = rows
    const count = currentRows.length
    untrack(() => get(virtualizerStore).setOptions({ count }))
    if (currentRows !== previousRows) {
      if (scrollElement) scrollElement.scrollTop = 0
      previousRows = currentRows
    }
  })

  const paddingTop = $derived(virtualRows[0]?.start ?? 0)
  const paddingBottom = $derived.by(() => {
    const lastVirtualRow = virtualRows[virtualRows.length - 1]
    return lastVirtualRow ? totalSize - lastVirtualRow.end : 0
  })
</script>

<div class="flex size-full flex-col overflow-hidden">
  <div bind:this={scrollElement} class="w-full overflow-auto">
    <table class="table table-pin-rows table-fixed table-zebra table-sm">
      <thead>
        {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
          <tr>
            {#each headerGroup.headers as header (header.id)}
              {@const sortState = header.column.getIsSorted()}
              {@const uniqueValues = header.column.getFacetedUniqueValues()}
              <th
                colSpan={header.colSpan}
                style:width={header.column.columnDef.meta?.width ?? "auto"}
                aria-sort={sortState === "asc"
                  ? "ascending"
                  : sortState === "desc"
                    ? "descending"
                    : "none"}
              >
                {#if !header.isPlaceholder}
                  <button
                    type="button"
                    class="cursor-pointer"
                    onclick={header.column.getToggleSortingHandler()}
                  >
                    <FlexRender {header} />
                    {#if sortState === "asc"}
                      ▴
                    {:else if sortState === "desc"}
                      ▾
                    {/if}
                  </button>
                  {#if header.column.getCanFilter()}
                    <div>
                      <datalist id="{header.column.id}List">
                        {#each uniqueValues.keys() as value (value)}
                          <option {value}></option>
                        {/each}
                      </datalist>
                      <DebouncedInput
                        class="input mt-1 input-xs"
                        name="filter-{header.column.id}"
                        type="text"
                        aria-label="{m.filter()} {header.column.id}"
                        value={(header.column.getFilterValue() ?? "") as string}
                        onchange={(value) => header.column.setFilterValue(value)}
                        debounce={500}
                        placeholder="{m.filter()} ({uniqueValues.size})"
                        list="{header.column.id}List"
                      />
                    </div>
                  {/if}
                {/if}
              </th>
            {/each}
          </tr>
        {/each}
      </thead>
      <tbody>
        {#if paddingTop > 0}
          <tr aria-hidden="true">
            <td colspan={columns.length || 1} style:height="{paddingTop}px"></td>
          </tr>
        {/if}
        {#each virtualRows as virtualRow (virtualRow.key)}
          {@const row = rows[virtualRow.index]}
          <tr
            data-index={virtualRow.index}
            {@attach (element) => get(virtualizerStore).measureElement(element)}
          >
            {#each row.getAllCells() as cell (cell.id)}
              <td
                class="truncate"
                style:width={cell.column.columnDef.meta?.width ?? "auto"}
                title={renderValue(cell.getValue(), cell.column.columnDef.meta?.dataType)}
              >
                <FlexRender {cell} />
              </td>
            {/each}
          </tr>
        {/each}
        {#if paddingBottom > 0}
          <tr aria-hidden="true">
            <td colspan={columns.length || 1} style:height="{paddingBottom}px"></td>
          </tr>
        {/if}
      </tbody>
    </table>
  </div>
</div>
