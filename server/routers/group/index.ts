import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";

import { GroupSchema } from "~/client/src/routes/_auth/group/index.lazy";
import { FlockMembers, Flocks } from "~/server/db/src/schema";
import { protectedProcedure, router } from "~/server/trpc";

export const groupRouter = router({
  create: protectedProcedure
    .input(GroupSchema)
    .mutation(async ({ ctx, input }) => {
      const [group] = await ctx.db
        .select()
        .from(Flocks)
        .innerJoin(
          FlockMembers,
          and(
            eq(FlockMembers.flockId, Flocks.id),
            eq(FlockMembers.userId, ctx.user.id),
          ),
        );
      if (group)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User already has group",
        });

      if (!input.name.trim() || !input.description.trim())
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Name or Description Empty",
        });

      try {
        const { insertId } = await ctx.db
          .insert(Flocks)
          .values({ name: input.name, description: input.description });
        await ctx.db
          .insert(FlockMembers)
          .values({ flockId: parseInt(insertId), userId: ctx.user.id });
      } catch (e) {
        if (e instanceof Error) {
          if (e.message.includes("code = AlreadyExists"))
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Duplicate Group Name",
            });
        }
      }
    }),
});
