import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Link, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { httpBatchLink } from "@trpc/client";
import SuperJSON from "superjson";

import { trpc } from "~/client/utils/trpc";

export const Route = createRootRoute({
  component: () => {
    const [queryClient] = useState(() => new QueryClient());
    const [trpcClient] = useState(() =>
      trpc.createClient({
        transformer: SuperJSON,
        links: [
          httpBatchLink({
            url: `${window.location.origin}/trpc`,
          }),
        ],
      }),
    );
    return (
      <div className="min-h-screen text-slate-200 bg-slate-900">
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="flex items-center justify-center gap-4 py-7 bg-slate-800 border-b border-slate-700">
              <Link to="/" className="[&.active]:font-bold">
                Home
              </Link>{" "}
              <Link to="/about" className="[&.active]:font-bold">
                About
              </Link>
            </div>
            <Outlet />
            <TanStackRouterDevtools />
          </QueryClientProvider>
        </trpc.Provider>
      </div>
    );
  },
});
