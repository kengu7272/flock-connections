import { initTRPC, TRPCError } from "@trpc/server";
import type { AnyRouter } from "@trpc/server";
import type { FetchHandlerRequestOptions } from "@trpc/server/adapters/fetch";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { MiddlewareHandler } from "hono";
import SuperJSON from "superjson";

import { db } from "./db";
import { Flock, User } from "./db/src/types";

type tRPCOptions = Omit<
  FetchHandlerRequestOptions<AnyRouter>,
  "req" | "endpoint"
> &
  Partial<Pick<FetchHandlerRequestOptions<AnyRouter>, "endpoint">>;

type trpcContext = {
  db: typeof db;
  user: User;
  flock: Flock | null;
};

const t = initTRPC.context<trpcContext>().create({ transformer: SuperJSON });

export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(
  async function isAuthed(opts) {
    const { ctx } = opts;
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED" });
    }
    return opts.next({
      ctx: {
        ...ctx,
      },
    });
  },
);
export const { router } = t;

// trpc middleware server from @hono/trpc-server but setting context manually
export const trpcServer = ({
  endpoint = "/trpc",
  ...rest
}: tRPCOptions): MiddlewareHandler => {
  return async (c) => {
    const res = fetchRequestHandler({
      ...rest,
      endpoint,
      req: c.req.raw,
      createContext: () => {
        return {
          db,
          user: c.get("user"),
          flock: c.get("flock"),
          session: c.get("session"),
        };
      },
    });
    return res;
  };
};
