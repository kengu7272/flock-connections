import { router } from "../trpc";
import { baseRouter } from "./base";
import { groupRouter } from "./group";
import { userRouter } from "./user";

export const appRouter = router({
  base: baseRouter,
  user: userRouter,
  group: groupRouter,
});

export type AppRouter = typeof appRouter;
