import { queryClient } from "@/shared/api/queryClient"
import type { CreateMutationOptions } from "@tanstack/svelte-query"

export function runSyncMutation<TData, TError, TVariables, TContext>(
  options: CreateMutationOptions<TData, TError, TVariables, TContext>,
  variables: TVariables,
): Promise<TData> {
  const mutation = queryClient.getMutationCache().build(queryClient, {
    ...options,
    meta: { ...options.meta, sync: true },
  })
  return mutation.execute(variables)
}
