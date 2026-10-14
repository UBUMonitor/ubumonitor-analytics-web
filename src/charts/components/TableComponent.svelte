<script lang="ts">
  import type { LogEntryDto } from "@/backend/model"
  import { getCourseLogsList } from "@/backend/services/course-logs"
  import { chartStore } from "@/charts/chart.svelte"
  import { dashboardStore, getSelectedUsers } from "@/dashboard/dashboard.svelte"
  import { courseStore } from "@/header/course.svelte"
  import { m } from "@/shared/paraglide/messages"
  import { getLocale } from "@/shared/paraglide/runtime"
  import {
    createColumnHelper,
    createTable,
    FlexRender,
    tableFeatures,
  } from "@tanstack/svelte-table"
  import { onMount, untrack } from "svelte"

  const sections = $derived(dashboardStore.sectionItems.filter(({ checked }) => checked))
  const modules = $derived(dashboardStore.moduleItems.filter(({ checked }) => checked))
  const components = $derived(dashboardStore.componentItems.filter(({ checked }) => checked))
  const events = $derived(dashboardStore.eventItems.filter(({ checked }) => checked))

  const fetchSize = 30

  const features = tableFeatures({})

  const columnHelper = createColumnHelper<typeof features, LogEntryDto>()

  const columns = columnHelper.columns([
    columnHelper.accessor("timeCreated", {
      header: m.table_date_time(),
      cell: (info) => {
        const value = info.getValue()
        if (!value) return ""
        const date = new Date(value)
        return new Intl.DateTimeFormat(getLocale(), {
          dateStyle: "short",
          timeStyle: "short",
        }).format(date)
      },
    }),
    columnHelper.accessor("userFullName", { header: m.table_name() }),
    columnHelper.accessor("moduleName", { header: m.table_module() }),
    columnHelper.accessor("component", { header: m.table_component() }),
    columnHelper.accessor("eventName", { header: m.table_event() }),
    columnHelper.accessor("originName", { header: m.table_origin() }),
    columnHelper.accessor("ip", { header: m.table_ip() }),
  ])

  let rows = $state<LogEntryDto[]>([])
  let pageIndex = $state(0)
  let totalElements = $state(0)
  let isLoading = $state(false)
  let hasMore = $state(true)

  let tableContainerRef: HTMLDivElement | undefined

  let requestId = 0

  async function loadPage(p: number, { reset = false } = {}) {
    if (isLoading) return
    if (!reset && !hasMore) return

    const currentRequest = ++requestId
    isLoading = true

    const selectedUsers = getSelectedUsers()
    try {
      const response = await getCourseLogsList(courseStore.currentCourseId, {
        timeRange: { from: chartStore.from, to: chartStore.to },
        filters: {
          userIds: selectedUsers.map(({ id }) => id),
          moduleIds:
            dashboardStore.selectedInfo === "module" ? modules.map(({ id }) => id) : undefined,
          sectionIds:
            dashboardStore.selectedInfo === "section" ? sections.map(({ id }) => id) : undefined,
          componentIds:
            dashboardStore.selectedInfo === "component"
              ? components.map(({ id }) => id)
              : undefined,
          eventIds:
            dashboardStore.selectedInfo === "event" ? events.map(({ id }) => id) : undefined,
        },
        fields: [
          "TIMESTAMP",
          "USER_FULL_NAME",
          "MODULE_NAME",
          "COMPONENT_NAME",
          "EVENT_NAME",
          "ORIGIN_NAME",
          "IP_ADDRESS",
        ],
        pagination: { page: p, size: fetchSize },
        sort: [{ field: "TIMESTAMP", direction: "ASC" }],
        includeTotal: true,
      })

      // Discard this response if a filter change triggered another reset while it was pending.
      if (currentRequest !== requestId) return

      rows = reset ? response.content : [...rows, ...response.content]
      totalElements = response.page.totalElements
      pageIndex = p
      hasMore = rows.length < totalElements && response.content.length > 0

      if (reset) {
        // If the initial rows do not fill the container, no scroll event will load the next page.
        // Check manually after the DOM updates with the new rows.
        queueMicrotask(() => fetchMoreOnBottomReached(tableContainerRef))
      }
    } catch (err) {
      if (currentRequest !== requestId) return
      console.error(err)
    } finally {
      if (currentRequest === requestId) isLoading = false
    }
  }

  function resetAndLoad() {
    requestId++
    rows = []
    pageIndex = 0
    hasMore = true
    void loadPage(0, { reset: true })
  }

  $effect(() => {
    void chartStore.from
    void chartStore.to
    void dashboardStore.selectedInfo
    void sections
    void modules
    void components
    void events
    void getSelectedUsers()
    untrack(() => resetAndLoad())
  })

  function fetchMoreOnBottomReached(el?: HTMLDivElement | null) {
    if (!el) return
    const { scrollHeight, scrollTop, clientHeight } = el
    if (scrollHeight - scrollTop - clientHeight < 500 && !isLoading && hasMore) {
      void loadPage(pageIndex + 1)
    }
  }

  onMount(() => {
    fetchMoreOnBottomReached(tableContainerRef)
  })

  const table = createTable({
    features,
    get data() {
      return rows
    },
    columns,
  })
</script>

<div class="flex size-full flex-col overflow-hidden">
  <div
    class="w-full overflow-auto"
    bind:this={tableContainerRef}
    onscroll={(e) => fetchMoreOnBottomReached(e.currentTarget as HTMLDivElement)}
  >
    <table class="table table-pin-rows table-zebra">
      <thead>
        {#each table.getHeaderGroups() as headerGroup (headerGroup.id)}
          <tr>
            {#each headerGroup.headers as header (header.id)}
              <th colSpan={header.colSpan}>
                {#if !header.isPlaceholder}
                  <FlexRender {header} />
                {/if}
              </th>
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

  <div class="flex items-center justify-between px-2 py-1 text-sm text-base-content/60">
    <span>
      {m.table_row_count({
        shown: rows.length.toLocaleString(getLocale()),
        total: totalElements.toLocaleString(getLocale()),
      })}
    </span>
    {#if isLoading}
      <span class="flex items-center gap-1">
        <span class="loading loading-xs loading-spinner"></span>
        {m.table_loading()}
      </span>
    {/if}
  </div>
</div>
