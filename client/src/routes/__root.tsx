import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { httpBatchLink } from "@trpc/client";
import { ToastContainer } from "react-toastify";
import SuperJSON from "superjson";

import "react-toastify/dist/ReactToastify.css";

import { trpc } from "~/client/utils/trpc";

export const Route = createRootRoute({
  notFoundComponent: () => {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-800 text-white">
        <span className="mb-6 text-6xl">
          {" "}
          Hey I think you might have messed up somewhere{" "}
        </span>
        <span>Best Regards,</span>
        <span>Kevin</span>
      </div>
    );
  },
  component: () => {
    const [queryClient] = useState(() => new QueryClient());
    const [trpcClient] = useState(() =>
      trpc.createClient({
        transformer: SuperJSON,
        links: [
          httpBatchLink({
            url: `${window.location.origin}/api/trpc`,
          }),
        ],
      }),
    );

    return (
      <div className="min-h-screen bg-slate-900 text-slate-200">
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <ToastContainer />
            <Outlet />
            <TanStackRouterDevtools />
          </QueryClientProvider>
        </trpc.Provider>
      </div>
    );
  },
});
