import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { httpBatchLink } from "@trpc/client";
import { ToastContainer } from "react-toastify";
import SuperJSON from "superjson";

import "react-toastify/dist/ReactToastify.css";

import { trpc } from "~/client/utils/trpc";
import Navbar from "./-components/navbar";

export const Route = createRootRoute({
  notFoundComponent: () => {
    return (
      <div className="h-screen w-full bg-slate-800 text-white flex flex-col justify-center items-center">
        <span className="text-6xl mb-6"> Hey I think you might have messed up somewhere </span>
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
            url: `${window.location.origin}/trpc`,
          }),
        ],
      }),
    );

    return (
      <div className="min-h-screen bg-slate-900 text-slate-200">
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <ToastContainer />
            <Navbar />
            <Outlet />
            <TanStackRouterDevtools />
          </QueryClientProvider>
        </trpc.Provider>
      </div>
    );
  },
});
