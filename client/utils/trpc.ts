import type { AppRouter } from '~/server/routers/appRouter';
import { createTRPCReact } from '@trpc/react-query';
 
export const trpc = createTRPCReact<AppRouter>();

