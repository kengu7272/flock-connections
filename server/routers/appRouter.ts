import { router } from "../trpc";
import { baseRouter } from "./base";
import { flockRouter } from "./flock";
import { userRouter } from "./user";

export const appRouter = router({
  base: baseRouter,
  user: userRouter,
  flock: flockRouter,
});

export type AppRouter = typeof appRouter;
