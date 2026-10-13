import type { Component, ComponentProps } from "svelte"

export const dialog = $state({
  component: null as Component | null,
  props: undefined as ComponentProps<Component> | undefined,
  dialogRef: null as HTMLDialogElement | null,
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function openDialog<C extends Component<any>>(component: C, props?: ComponentProps<C>) {
  dialog.component = component
  dialog.props = props
  dialog.dialogRef?.showModal()
}

export function closeDialog() {
  dialog.dialogRef?.close()
}
