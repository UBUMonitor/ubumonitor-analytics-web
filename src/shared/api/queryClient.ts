import { notifyError, trackSyncMutations } from "@/shared/lib/notify"
import { MutationCache, QueryCache, QueryClient } from "@tanstack/svelte-query"

export function createAppQueryClient() {
  const mutationCache = new MutationCache({ onError: notifyError })
  trackSyncMutations(mutationCache)

  return new QueryClient({
    queryCache: new QueryCache({ onError: notifyError }),
    mutationCache,
    defaultOptions: {
      queries: {
        staleTime: 0,
        gcTime: 0,
        refetchOnWindowFocus: false,
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export const queryClient = createAppQueryClient()
