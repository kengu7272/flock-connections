import { router } from "../../trpc";
import { baseRouter } from "./base";
import { flockRouter } from "./flock";
import { postRouter } from "./post";
import { userRouter } from "./user";

export const appRouter = router({
  base: baseRouter,
  user: userRouter,
  flock: flockRouter,
  post: postRouter,
});

export type AppRouter = typeof appRouter;
