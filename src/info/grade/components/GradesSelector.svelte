<script lang="ts">
  import GradeItem from "@/info/grade/components/GradeItem.svelte"
  import { gradeStore } from "@/info/grade/grade.svelte"
  import Select from "@/shared/components/Select.svelte"
  import SelectButtons from "@/shared/components/SelectButtons.svelte"
  import { m } from "@/shared/paraglide/messages"
</script>

<SelectButtons class="border-b border-base-200 p-1" items={gradeStore.items} />
<Select component={GradeItem} items={gradeStore.items} ariaLabel={m.grade_items_label()} />
