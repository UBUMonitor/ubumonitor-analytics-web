export interface SelectableItem {
  id: number
  checked: boolean
}

export interface NamedSelectableItem extends SelectableItem {
  name: string
}

interface FlatNode {
  readonly id: number
  readonly parentId?: number
}

export interface IdTreeNode {
  id: number
  children: IdTreeNode[]
}

export function buildIdTree(items: readonly FlatNode[]): IdTreeNode[] {
  const nodes = new Map<number, IdTreeNode>()

  for (const { id } of items) {
    nodes.set(id, { id, children: [] })
  }

  const roots: IdTreeNode[] = []

  for (const { id, parentId } of items) {
    const node = nodes.get(id)!
    const parent = parentId != null ? nodes.get(parentId) : undefined

    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  return roots
}
