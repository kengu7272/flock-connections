import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { FlockSchema } from "~/client/src/routes/_auth/flock/index.lazy";
import { FlockMembers, Flocks, Users } from "~/server/db/src/schema";
import { protectedProcedure, router } from "~/server/trpc";

export const flockRouter = router({
  create: protectedProcedure
    .input(FlockSchema)
    .mutation(async ({ ctx, input }) => {
      const [flock] = await ctx.db
        .select()
        .from(Flocks)
        .innerJoin(
          FlockMembers,
          and(
            eq(FlockMembers.flockId, Flocks.id),
            eq(FlockMembers.userId, ctx.user.id),
          ),
        );
      if (flock)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User already has flock",
        });

      if (!input.name.trim() || !input.description.trim())
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Name or Description Empty",
        });

      try {
        const [{ insertId }] = await ctx.db.insert(Flocks).values({
          name: input.name,
          description: input.description,
          picture: ctx.user.picture,
        });
        await ctx.db
          .insert(FlockMembers)
          .values({ flockId: insertId, userId: ctx.user.id });
      } catch (e) {
        if (e instanceof Error) {
          if (e.message.includes("code = AlreadyExists"))
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Duplicate Flock Name",
            });
        }
      }
    }),
  getMembers: protectedProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ ctx, input }) => {
      const members = await ctx.db
        .select({ user: { username: Users.username, picture: Users.picture } })
        .from(FlockMembers)
        .innerJoin(Users, eq(Users.id, FlockMembers.userId))
        .innerJoin(Flocks, eq(Flocks.id, FlockMembers.flockId))
        .where(eq(Flocks.name, input.name))
        .orderBy(Users.username);

      // check if user is in the group
      if (!members.some((member) => member.user.username === ctx.user.username))
        throw new TRPCError({ code: "UNAUTHORIZED" });

      return members;
    }),
  getInfo: protectedProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ ctx, input }) => {
      const [info] = await ctx.db
        .select({
          name: Flocks.name,
          picture: Flocks.picture,
          description: Flocks.description,
        })
        .from(Flocks)
        .innerJoin(
          FlockMembers,
          and(
            eq(FlockMembers.flockId, Flocks.id),
            eq(FlockMembers.userId, ctx.user.id),
          ),
        )
        .where(eq(Flocks.name, input.name));

      if (!info) throw new TRPCError({ code: "UNAUTHORIZED" });

      return info;
    }),
});
