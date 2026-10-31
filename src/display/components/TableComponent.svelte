<script lang="ts">
  import { renderValue, type DynamicRow, features, type TableOption } from "@/display/impl/table"
  import DebouncedInput from "@/shared/components/DebouncedInput.svelte"
  import { m } from "@/shared/paraglide/messages"
  import { createTable, FlexRender, type ColumnDef } from "@tanstack/svelte-table"
  import { createVirtualizer } from "@tanstack/svelte-virtual"
  import { get } from "svelte/store"

  interface Props {
    option: TableOption
  }

  let { option }: Props = $props()
  let scrollElement: HTMLDivElement | undefined = $state(undefined)

  const data = $derived(option.data)
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
      return data
    },
    get columns() {
      return columns
    },
  })

  const rows = $derived(table.getRowModel().rows)

  const virtualizer = createVirtualizer({
    get count() {
      return rows.length
    },
    getScrollElement: () => scrollElement ?? null,
    estimateSize: () => 46,
  })

  $effect.pre(() => {
    get(virtualizer).setOptions({ count: rows.length })
    if (scrollElement) scrollElement.scrollTop = 0
  })

  function measureElement(element: HTMLTableRowElement) {
    get(virtualizer).measureElement(element)
  }

  const virtualRows = $derived($virtualizer.getVirtualItems())
  const paddingTop = $derived(virtualRows[0]?.start ?? 0)
  const paddingBottom = $derived.by(() => {
    const lastVirtualRow = virtualRows[virtualRows.length - 1]
    return lastVirtualRow ? $virtualizer.getTotalSize() - lastVirtualRow.end : 0
  })
</script>

<div class="flex size-full flex-col overflow-hidden">
  <div bind:this={scrollElement} class="w-full overflow-auto">
    <table class="table table-sm table-pin-rows table-zebra table-fixed">
      <thead>
        {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
          <tr>
            {#each headerGroup.headers as header (header.id)}
              <th
                colSpan={header.colSpan}
                style:width={header.column.columnDef.meta?.width ?? "auto"}
              >
                {#if !header.isPlaceholder}
                  <button class="cursor-pointer" onclick={header.column.getToggleSortingHandler()}>
                    <FlexRender {header} />
                    {#if header.column.getIsSorted() === "asc"}
                      ▴
                    {:else if header.column.getIsSorted() === "desc"}
                      ▾
                    {/if}
                  </button>
                  {#if header.column.getCanFilter()}
                    <div>
                      <datalist id="{header.column.id}List">
                        {#each header.column.getFacetedUniqueValues().keys() as value (value)}
                          <option {value}></option>
                        {/each}
                      </datalist>
                      <DebouncedInput
                        class="input input-xs mt-1"
                        name="filter-{header.column.id}"
                        type="text"
                        value={(header.column.getFilterValue() ?? "") as string}
                        onchange={(value) => header.column.setFilterValue(value)}
                        debounce={500}
                        placeholder="{m.filter_label()} ({header.column.getFacetedUniqueValues()
                          .size})"
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
          <tr data-index={virtualRow.index} use:measureElement>
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
