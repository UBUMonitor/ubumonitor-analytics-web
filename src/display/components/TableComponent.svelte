<script lang="ts">
  import { renderValue, type DynamicRow, features, type TableOption } from "@/display/impl/table"
  import { createTable, FlexRender, type ColumnDef } from "@tanstack/svelte-table"

  interface Props {
    option: TableOption
  }

  let { option }: Props = $props()

  const data = $derived(option.data)
  const columns = $derived.by<Array<ColumnDef<typeof features, DynamicRow>>>(() => {
    if (option.columns.length === 0) return []

    return option.columns.map((column): ColumnDef<typeof features, DynamicRow> => {
      const dataType = column.type

      return {
        accessorKey: column.key,
        header: column.name,
        meta: { dataType },
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
    debugTable: true,
  })
</script>

<div class="flex size-full flex-col overflow-hidden">
  <div class="w-full overflow-auto">
    <table class="table table-pin-rows table-zebra">
      <thead>
        {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
          <tr>
            {#each headerGroup.headers as header (header.id)}
              <td colSpan={header.colSpan}>
                {#if !header.isPlaceholder}
                  <FlexRender {header} />
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </thead>
      <tbody>
        {#each table.getRowModel().rows as row (row.id)}
          <tr>
            {#each row.getAllCells() as cell (cell.id)}
              <td>
                <FlexRender {cell} />
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
