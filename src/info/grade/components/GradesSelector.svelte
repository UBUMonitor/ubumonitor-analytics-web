<script lang="ts">
  import GradeItem from "@/info/grade/components/GradeItem.svelte"
  import { gradeStore } from "@/info/grade/grade.svelte"
  import Select from "@/shared/components/Select.svelte"
  import SelectButtons from "@/shared/components/SelectButtons.svelte"
  import { setChecked } from "@/shared/lib/selection"
  import { m } from "@/shared/paraglide/messages"
  import type { SelectableItem } from "@/shared/types/selectable-item"
</script>

<SelectButtons
  class="border-b border-base-200 p-1"
  items={gradeStore.items}
  onToggleAll={setChecked}
/>
<Select
  item={gradeItem}
  items={gradeStore.items}
  ariaLabel={m.grade_items()}
  onToggle={(item, checked) => (item.checked = checked)}
  onToggleAll={setChecked}
/>

{#snippet gradeItem(grade: SelectableItem)}
  <GradeItem item={grade} />
{/snippet}
