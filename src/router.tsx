import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

const FIVE_MINUTES = 5 * 60 * 1000;
const TEN_MINUTES = 10 * 60 * 1000;

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 5 minutes — no refetch during this window
        staleTime: FIVE_MINUTES,
        // Keep unused data in cache for 10 minutes
        gcTime: TEN_MINUTES,
        // Don't refetch just because the user switched browser tabs
        refetchOnWindowFocus: false,
        // Don't refetch on reconnect for static data
        refetchOnReconnect: false,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Match staleTime so preloaded data isn't immediately re-fetched on navigation
    defaultPreloadStaleTime: FIVE_MINUTES,
  });

  return router;
};
