import {
  createTRPCProxyClient,
  createTRPCReact,
  httpBatchLink,
} from "@trpc/react-query";
import SuperJSON from "superjson";

import type { AppRouter } from "~/server/routers/appRouter";

export const trpc = createTRPCReact<AppRouter>();

// vanilla client
export const client = createTRPCProxyClient<AppRouter>({
  transformer: SuperJSON,
  links: [
    httpBatchLink({
      url: `http://localhost:3000/trpc`,
    }),
  ],
});
