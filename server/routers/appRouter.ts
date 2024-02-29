import { router } from '../trpc';
import { baseRouter } from './base';

export const appRouter = router({
  base: baseRouter,
})

export type AppRouter = typeof appRouter;
