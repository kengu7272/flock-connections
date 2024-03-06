import { router } from '../trpc';
import { baseRouter } from './base';
import { userRouter } from './user';

export const appRouter = router({
  base: baseRouter,
  user: userRouter,
})

export type AppRouter = typeof appRouter;
