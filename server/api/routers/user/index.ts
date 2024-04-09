import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import {
  FlockActions,
  FlockMemberActions,
  FlockMembers,
  Flocks,
  Users,
} from "~/server/db/src/schema";
import { protectedProcedure, router } from "~/server/trpc";
import { ProfileSchema } from "~/server/validation";

export const userRouter = router({
  userInfo: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),
  updateProfile: protectedProcedure
    .input(ProfileSchema)
    .mutation(async ({ ctx, input }) => {
      if (!input.bio?.length && !input.username?.length)
        throw new TRPCError({ code: "BAD_REQUEST", message: "No Content" });

      const set = {
        ...(input.username?.length ? { username: input.username } : {}),
        ...(input.bio?.length ? { bio: input.bio } : {}),
      };

      if (input.username?.length) {
        const existingUser = await ctx.db
          .select()
          .from(Users)
          .where(eq(Users.username, input.username));
        if (existingUser.length)
          throw new TRPCError({
            code: "CONFLICT",
            message: "Duplicate username",
          });
      }

      await ctx.db.update(Users).set(set).where(eq(Users.id, ctx.user.id));
    }),
  getFlock: protectedProcedure.query(async ({ ctx }) => { const [flock] = await ctx.db
      .select({ flock: { name: Flocks.name } })
      .from(FlockMembers)
      .innerJoin(Flocks, eq(Flocks.id, FlockMembers.flockId))
      .where(eq(FlockMembers.userId, ctx.user.id));

    return flock ?? null;
  }),
  getOutstandingInvites: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select({ name: Flocks.name })
      .from(FlockActions)
      .innerJoin(
        FlockMemberActions,
        eq(FlockMemberActions.actionId, FlockActions.id),
      )
      .innerJoin(Flocks, eq(Flocks.id, FlockActions.flockId))
      .where(
        and(
          eq(FlockActions.accepted, true),
          eq(FlockActions.type, "INVITE"),
          eq(FlockMemberActions.outstanding, true),
          eq(FlockMemberActions.userId, ctx.user.id),
        ),
      );
  }),
  acceptInvite: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [flock] = await ctx.db
        .select({ id: Flocks.id, actionId: FlockActions.id })
        .from(FlockActions)
        .innerJoin(
          FlockMemberActions,
          eq(FlockMemberActions.actionId, FlockActions.id),
        )
        .innerJoin(Flocks, eq(Flocks.id, FlockActions.flockId))
        .where(
          and(
            eq(FlockActions.accepted, true),
            eq(FlockActions.type, "INVITE"),
            eq(FlockMemberActions.outstanding, true),
            eq(FlockMemberActions.userId, ctx.user.id),
            eq(Flocks.name, input.name),
          ),
        );

      if (!flock)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No invite found",
        });

      // delete user from member lists to avoid having to check to update
      await ctx.db
        .delete(FlockMembers)
        .where(eq(FlockMembers.userId, ctx.user.id));
      await ctx.db
        .insert(FlockMembers)
        .values({ flockId: flock.id, userId: ctx.user.id });
      await ctx.db
        .update(FlockMemberActions)
        .set({ outstanding: false, accepted: true })
        .where(eq(FlockMemberActions.actionId, flock.actionId));
    }),
  declineInvite: protectedProcedure
    .input(z.object({ name: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const [flock] = await ctx.db
        .select({ id: Flocks.id, actionId: FlockActions.id })
        .from(FlockActions)
        .innerJoin(
          FlockMemberActions,
          eq(FlockMemberActions.actionId, FlockActions.id),
        )
        .innerJoin(Flocks, eq(Flocks.id, FlockActions.flockId))
        .where(
          and(
            eq(FlockActions.accepted, true),
            eq(FlockActions.type, "INVITE"),
            eq(FlockMemberActions.outstanding, true),
            eq(FlockMemberActions.userId, ctx.user.id),
            eq(Flocks.name, input.name),
          ),
        );

      if (!flock)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No invite found",
        });

      await ctx.db
        .update(FlockMemberActions)
        .set({ outstanding: false })
        .where(eq(FlockMemberActions.actionId, flock.actionId));
    }),
  clearBio: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .update(Users)
      .set({ bio: "" })
      .where(eq(Users.id, ctx.user.id));
  }),
  leaveFlock: protectedProcedure.mutation(async ({ ctx }) => {
    await ctx.db
      .delete(FlockMembers)
      .where(eq(FlockMembers.userId, ctx.user.id));
  }),
});
