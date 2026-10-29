import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { createQueryClient } from "@/lib/query-client";

export function getRouter() {
  const queryClient = createQueryClient();
  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: "intent",
    scrollRestoration: true,
  });

  setupRouterSsrQueryIntegration({ router, queryClient });
  return router;
}
