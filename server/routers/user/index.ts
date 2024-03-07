import { eq } from "drizzle-orm";
import { z } from "zod";

import { Users } from "~/server/db/src/schema";
import { protectedProcedure, router } from "~/server/trpc";

export const userRouter = router({
  userInfo: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),
  updateProfile: protectedProcedure
    .input(z.object({ bio: z.string().optional(), }))
    .mutation(async ({ ctx, input }) => {
      if(!input.bio)
        return;

      await ctx.db
        .update(Users)
        .set({ bio: input.bio, })
        .where(eq(Users.id, ctx.user.id));
    }),
});
