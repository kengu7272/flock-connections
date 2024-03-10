import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";

import { GroupSchema } from "~/client/src/routes/_auth/group/index.lazy";
import { GroupMembers, Groups } from "~/server/db/src/schema";
import { protectedProcedure, router } from "~/server/trpc";

export const groupRouter = router({
  create: protectedProcedure
    .input(GroupSchema)
    .mutation(async ({ ctx, input }) => {
      const [group] = await ctx.db
        .select()
        .from(Groups)
        .innerJoin(
          GroupMembers,
          and(
            eq(GroupMembers.groupId, Groups.id),
            eq(GroupMembers.userId, ctx.user.id),
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
          .insert(Groups)
          .values({ name: input.name, description: input.description });
        await ctx.db
          .insert(GroupMembers)
          .values({ groupId: parseInt(insertId), userId: ctx.user.id });
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
