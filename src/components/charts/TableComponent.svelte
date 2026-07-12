<script lang="ts">
  import { appStore, getSelectedUsers } from "@/lib/appStore.svelte"
  import { getCurrentCourseId } from "@/lib/sessionStore.svelte"
  import type { CourseLogsInfoResponseDto, LogEntryDto } from "@/model"
  import { getLocale } from "@/paraglide/runtime"
  import { getCourseLogs } from "@/services/course-logs/course-logs"
  import {
    createColumnHelper,
    createTable,
    FlexRender,
    tableFeatures,
  } from "@tanstack/svelte-table"
  import { onMount, untrack } from "svelte"

  const sections = $derived(appStore.sectionItems.filter(({ checked }) => checked))
  const modules = $derived(appStore.moduleItems.filter(({ checked }) => checked))

  const fetchSize = 30

  const features = tableFeatures({})

  const columnHelper = createColumnHelper<typeof features, LogEntryDto>()

  const columns = columnHelper.columns([
    columnHelper.accessor("timeCreated", {
      header: "Fecha y Hora",
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
    columnHelper.accessor("userFullName", { header: "Nombre" }),
    columnHelper.accessor("moduleName", { header: "Módulo" }),
    columnHelper.accessor("component", { header: "Componente" }),
    columnHelper.accessor("eventName", { header: "Evento" }),
    columnHelper.accessor("originName", { header: "Origen" }),
    columnHelper.accessor("ip", { header: "IP" }),
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
      const result = await getCourseLogs(getCurrentCourseId(), {
        timeRange: { from: appStore.from, to: appStore.to },
        filters: {
          userIds: selectedUsers.map(({ id }) => id),
          moduleIds: appStore.selectedInfo === "module" ? modules.map(({ id }) => id) : undefined,
          sectionIds:
            appStore.selectedInfo === "section" ? sections.map(({ id }) => id) : undefined,
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

      // Si mientras esperábamos la respuesta se disparó otro reset
      // (cambio de filtros), esta respuesta ya es obsoleta: se descarta.
      if (currentRequest !== requestId) return

      const response = result.data as CourseLogsInfoResponseDto

      rows = reset ? response.content : [...rows, ...response.content]
      totalElements = response.page.totalElements
      pageIndex = p
      hasMore = rows.length < totalElements && response.content.length > 0

      if (reset) {
        // Si el contenido inicial no llena el contenedor, no habrá scroll
        // que dispare la siguiente carga: lo comprobamos manualmente
        // tras que el DOM se actualice con las nuevas filas.
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
    void appStore.from
    void appStore.to
    void appStore.selectedInfo
    void sections
    void modules
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
    <table class="table-pin-rows table table-zebra">
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
    <span>{rows.length.toLocaleString()} de {totalElements.toLocaleString()} registros</span>
    {#if isLoading}
      <span class="flex items-center gap-1">
        <span class="loading loading-xs loading-spinner"></span>
        Cargando...
      </span>
    {/if}
  </div>
</div>
