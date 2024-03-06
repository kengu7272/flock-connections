import { eq } from "drizzle-orm";
import { z } from "zod";

import { Users } from "~/server/db/src/schema";
import { protectedProcedure, router } from "~/server/trpc";

export const userRouter = router({
  userInfo: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),
  updateProfile: protectedProcedure
    .input(z.object({ username: z.string().optional(), }))
    .mutation(async ({ ctx, input }) => {
      if(!input.username)
        return;

      await ctx.db
        .update(Users)
        .set({ username: input.username, })
        .where(eq(Users.id, ctx.user.id));
    }),
});
