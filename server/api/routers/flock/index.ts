import { TRPCError } from "@trpc/server";
import { and, count, desc, eq, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/mysql-core";
import { nanoid } from "nanoid";
import { z } from "zod";

import {
  FlockActions,
  FlockDetailsActions,
  FlockMemberActions,
  FlockMembers,
  FlockMemberVotes,
  Flocks,
  Posts,
  Users,
} from "~/server/db/src/schema";
import { protectedProcedure, router } from "~/server/trpc";
import { utapi } from "~/server/uploadthing";
import { getKey } from "~/server/utils/parsing";
import { FlockSchema, MemberInviteSchema } from "~/server/validation";

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
        .where(eq(Flocks.name, input.name));

      if (!info) throw new TRPCError({ code: "UNAUTHORIZED" });

      return info;
    }),
  getVotes: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.flock)
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You're not in a Flock",
      });

    const involving = alias(Users, "involving");
    const creator = alias(Users, "creator");
    const memberVotes = await ctx.db
      .select({
        type: FlockActions.type,
        involving: involving.username,
        yes: sql`(select count(*) from ${FlockMemberVotes} where ${FlockMemberVotes.actionId} = ${FlockActions.id} and ${FlockMemberVotes.vote} = 1)`.mapWith(
          Number,
        ),
        no: sql`(select count(*) from ${FlockMemberVotes} where ${FlockMemberVotes.actionId} = ${FlockActions.id} and ${FlockMemberVotes.vote} = 0)`.mapWith(
          Number,
        ),
        publicId: FlockActions.publicId,
        creator: creator.username,
      })
      .from(FlockActions)
      .innerJoin(
        FlockMemberActions,
        eq(FlockMemberActions.actionId, FlockActions.id),
      )
      .innerJoin(involving, eq(involving.id, FlockMemberActions.userId))
      .innerJoin(creator, eq(creator.id, FlockActions.creator))
      .where(
        and(
          eq(FlockActions.open, true),
          eq(FlockActions.flockId, ctx.flock.id),
          or(eq(FlockActions.type, "INVITE"), eq(FlockActions.type, "KICK")),
        ),
      )
      .groupBy(FlockActions.id)
      .orderBy(involving.username);

    const flockDetailsVotes = await ctx.db
      .select({
        yes: sql`(select count(*) from ${FlockMemberVotes} where ${FlockMemberVotes.actionId} = ${FlockActions.id} and ${FlockMemberVotes.vote} = 1)`.mapWith(
          Number,
        ),
        no: sql`(select count(*) from ${FlockMemberVotes} where ${FlockMemberVotes.actionId} = ${FlockActions.id} and ${FlockMemberVotes.vote} = 0)`.mapWith(
          Number,
        ),
        publicId: FlockActions.publicId,
        imageUrl: FlockDetailsActions.picture,
        description: FlockDetailsActions.description,
        creator: Users.username,
        type: FlockActions.type,
      })
      .from(FlockActions)
      .innerJoin(
        FlockDetailsActions,
        eq(FlockDetailsActions.actionId, FlockActions.id),
      )
      .innerJoin(Users, eq(Users.id, FlockActions.creator))
      .where(
        and(
          eq(FlockActions.open, true),
          eq(FlockActions.flockId, ctx.flock.id),
          or(
            eq(FlockActions.type, "UPDATE PICTURE"),
            eq(FlockActions.type, "UPDATE DESCRIPTION"),
            eq(FlockActions.type, "CREATE POST"),
          ),
        ),
      )
      .groupBy(FlockActions.id)
      .orderBy(desc(FlockActions.createdAt));

    return { memberVotes, flockDetailsVotes };
  }),
  createInvite: protectedProcedure
    .input(MemberInviteSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.flock)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You're not in a Flock",
        });

      if (ctx.user.username === input.username)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot invite yourself",
        });

      const [user] = await ctx.db
        .select({ id: Users.id })
        .from(Users)
        .where(eq(Users.username, input.username));
      if (!user)
        throw new TRPCError({ code: "BAD_REQUEST", message: "User not found" });

      // check if user already in the flock
      const [inFlock] = await ctx.db
        .select()
        .from(FlockMembers)
        .where(eq(FlockMembers.userId, user.id));
      if (inFlock)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User already in a Flock",
        });

      // if only one member voting doesn't need to happen
      const [members] = await ctx.db
        .select({ count: count(FlockMembers.userId) })
        .from(FlockMembers)
        .where(eq(FlockMembers.flockId, ctx.flock.id));
      if (members.count === 1) {
        await ctx.db
          .insert(FlockMembers)
          .values({ flockId: ctx.flock.id, userId: user.id });
        return;
      }

      // check if an invite is already active
      const [invite] = await ctx.db
        .select()
        .from(FlockActions)
        .innerJoin(
          FlockMemberActions,
          eq(FlockMemberActions.actionId, FlockActions.id),
        )
        .innerJoin(Users, eq(Users.id, FlockMemberActions.userId))
        .where(
          and(
            eq(FlockActions.flockId, ctx.flock.id),
            eq(Users.id, user.id),
            or(
              eq(FlockActions.open, true),
              eq(FlockMemberActions.outstanding, true),
            ),
            eq(FlockActions.type, "INVITE"),
          ),
        );
      if (invite)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Outstanding Vote Session or Invite",
        });

      const [{ insertId }] = await ctx.db.insert(FlockActions).values({
        flockId: ctx.flock.id,
        type: "INVITE",
        creator: ctx.user.id,
        publicId: nanoid(16),
      });
      await ctx.db
        .insert(FlockMemberActions)
        .values({ actionId: insertId, userId: user.id });
      await ctx.db.insert(FlockMemberVotes).values({
        userId: ctx.user.id,
        vote: true,
        actionId: insertId,
      });
    }),
  createKick: protectedProcedure
    .input(z.object({ username: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.flock)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You're not in a Flock",
        });

      if (ctx.user.username === input.username)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot kick yourself",
        });

      // can't have majority with 2 members
      const [members] = await ctx.db
        .select({ count: count(FlockMembers.userId) })
        .from(FlockMembers)
        .where(eq(FlockMembers.flockId, ctx.flock.id));
      if (members.count === 2)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot create a kick session with only two members",
        });

      const [user] = await ctx.db
        .select({ id: Users.id })
        .from(Users)
        .innerJoin(FlockMembers, eq(FlockMembers.userId, Users.id))
        .where(
          and(
            eq(Users.username, input.username),
            eq(FlockMembers.flockId, ctx.flock.id),
          ),
        );
      if (!user)
        throw new TRPCError({ code: "BAD_REQUEST", message: "User not found" });

      // check if a kick is already active
      const [kick] = await ctx.db
        .select()
        .from(FlockActions)
        .innerJoin(
          FlockMemberActions,
          eq(FlockMemberActions.actionId, FlockActions.id),
        )
        .innerJoin(Users, eq(Users.id, FlockMemberActions.userId))
        .where(
          and(
            eq(FlockActions.flockId, ctx.flock.id),
            eq(Users.id, user.id),
            eq(FlockActions.open, true),
            eq(FlockActions.type, "KICK"),
          ),
        );
      if (kick)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Outstanding Vote Session or Invite",
        });

      const [{ insertId }] = await ctx.db.insert(FlockActions).values({
        flockId: ctx.flock.id,
        type: "KICK",
        creator: ctx.user.id,
        publicId: nanoid(16),
      });
      await ctx.db.insert(FlockMemberActions).values({
        actionId: insertId,
        userId: user.id,
      });
      await ctx.db.insert(FlockMemberVotes).values({
        userId: ctx.user.id,
        vote: true,
        actionId: insertId,
      });
    }),
  vote: protectedProcedure
    .input(z.object({ publicId: z.string(), vote: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.flock)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not in Flock",
        });

      const [action] = await ctx.db
        .select({
          id: FlockActions.id,
          user: FlockMemberActions.userId,
          type: FlockActions.type,
          flockId: FlockActions.flockId,
        })
        .from(FlockActions)
        .leftJoin(
          FlockMemberActions,
          eq(FlockMemberActions.actionId, FlockActions.id),
        )
        .where(
          and(
            eq(FlockActions.publicId, input.publicId),
            eq(FlockActions.open, true),
            eq(FlockActions.flockId, ctx.flock.id),
          ),
        );

      if (!action)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Vote Session Not Found",
        });

      if (
        (action.type === "INVITE" || action.type === "KICK") &&
        action.user === ctx.user.id
      )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Cannot vote for yourself",
        });

      const [members] = await ctx.db
        .select({ count: count(FlockMembers.userId) })
        .from(FlockMembers)
        .where(eq(FlockMembers.flockId, action.flockId));

      if (members.count === 1) throw new TRPCError({ code: "BAD_REQUEST" });

      // checks if previously voted and updates accordingly
      const [previousVotes] = await ctx.db
        .select({ vote: FlockMemberVotes.vote })
        .from(FlockMemberVotes)
        .where(
          and(
            eq(FlockMemberVotes.actionId, action.id),
            eq(FlockMemberVotes.userId, ctx.user.id),
          ),
        );
      if (previousVotes) {
        if (previousVotes.vote === input.vote) return;

        await ctx.db
          .update(FlockMemberVotes)
          .set({ vote: input.vote })
          .where(
            and(
              eq(FlockMemberVotes.actionId, action.id),
              eq(FlockMemberVotes.userId, ctx.user.id),
            ),
          );
      } else
        await ctx.db.insert(FlockMemberVotes).values({
          actionId: action.id,
          vote: input.vote,
          userId: ctx.user.id,
        });

      // check if majority
      const [yesVotes, noVotes] = await ctx.db
        .select({ votes: count(FlockMemberVotes.userId) })
        .from(FlockMemberVotes)
        .where(and(eq(FlockMemberVotes.actionId, action.id)))
        .groupBy(FlockMemberVotes.vote)
        .orderBy(FlockMemberVotes.vote);
      const majority = Math.floor(members.count / 2) + 1;

      const yes = yesVotes ? yesVotes.votes : 0;
      const no = noVotes ? noVotes.votes : 0;
      const yesAndNo = yes + no;

      // if majority voted or group size is small enough
      if (
        no >= majority ||
        yes >= majority ||
        yesAndNo === members.count ||
        (yes === no && yesAndNo === members.count - 1)
      ) {
        await ctx.db
          .update(FlockActions)
          .set({ open: false })
          .where(eq(FlockActions.id, action.id));

        // different actions
        if (action.type === "INVITE" || action.type === "KICK") {
          // if vote is a no nothing happens
          if (no >= majority || (yes === no && yesAndNo === members.count)) {
            await ctx.db
              .update(FlockMemberActions)
              .set({ outstanding: false })
              .where(eq(FlockMemberActions.actionId, action.id));

            return { consensus: "No" };
          }

          await ctx.db
            .update(FlockActions)
            .set({ accepted: true })
            .where(eq(FlockActions.id, action.id));

          // if a vote is a kick active = false, otherwise outstanding invite
          if (action.type === "KICK" && action.user) {
            if (yes === no && yesAndNo === members.count - 1) {
              await ctx.db
                .update(FlockMemberActions)
                .set({ outstanding: false })
                .where(eq(FlockMemberActions.actionId, action.id));

              return { consensus: "No" };
            }

            await ctx.db
              .delete(FlockMembers)
              .where(eq(FlockMembers.userId, action.user));

            await ctx.db
              .update(FlockMemberActions)
              .set({ outstanding: false })
              .where(eq(FlockMemberActions.actionId, action.id));

            return { consensus: "Yes" };
          }
        } else if (action.type === "UPDATE PICTURE") {
          const [image] = await ctx.db
            .select({ url: FlockDetailsActions.picture })
            .from(FlockDetailsActions)
            .where(eq(FlockDetailsActions.actionId, action.id));
          const [url] = image.url ?? [];
          if (!url.length)
            throw new TRPCError({ code: "BAD_REQUEST", message: "No image" });
          if (no >= majority || (yes === no && yesAndNo === members.count)) {
            const key = getKey(url); // we don't store the key so construct it
            utapi.deleteFiles(key);
            return { consensus: "No" };
          }

          await ctx.db.update(Flocks).set({ picture: url });
          return { consensus: "Yes" };
        } else if (action.type === "UPDATE DESCRIPTION") {
          const [{ description }] = await ctx.db
            .select({ description: FlockDetailsActions.description })
            .from(FlockDetailsActions)
            .where(eq(FlockDetailsActions.actionId, action.id));
          if (!description)
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "No description",
            });

          if (no >= majority || (yes === no && yesAndNo === members.count)) {
            return { consensus: "No" };
          }

          await ctx.db.update(Flocks).set({ description: description });
          return { consensus: "Yes" };
        } else if (action.type === "CREATE POST") {
          const [{ description, pictures }] = await ctx.db
            .select({
              description: FlockDetailsActions.description,
              pictures: FlockDetailsActions.picture,
            })
            .from(FlockDetailsActions)
            .where(eq(FlockDetailsActions.actionId, action.id));
          if (!pictures?.length)
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "No Pictures",
            });
          if (no >= majority || (yes === no && yesAndNo === members.count)) {
            const keys = pictures.map((picture) => getKey(picture));
            utapi.deleteFiles(keys);
            return { consensus: "No" };
          }

          await ctx.db.insert(Posts).values({
            flockId: action.flockId,
            picture: pictures,
            description: description,
            publicId: nanoid(16),
          });
          return { consensus: "Yes" };
        }
      }
    }),
  getOutstandingInvites: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db
      .select({ user: Users.username, picture: Users.picture })
      .from(FlockActions)
      .innerJoin(
        FlockMemberActions,
        eq(FlockMemberActions.actionId, FlockActions.id),
      )
      .innerJoin(Users, eq(Users.id, FlockMemberActions.userId))
      .where(
        and(
          eq(FlockActions.type, "INVITE"),
          eq(FlockMemberActions.outstanding, true),
          eq(FlockActions.flockId, ctx.flock?.id ?? -1),
        ),
      );
  }),
  createUpdateDescription: protectedProcedure
    .input(FlockSchema.pick({ description: true }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.flock) throw new TRPCError({ code: "UNAUTHORIZED" });

      const [previousSession] = await ctx.db
        .select()
        .from(FlockActions)
        .where(
          and(
            eq(FlockActions.creator, ctx.user.id),
            eq(FlockActions.open, true),
            eq(FlockActions.type, "UPDATE DESCRIPTION"),
          ),
        );
      if (previousSession)
        throw new TRPCError({
          code: "CONFLICT",
          message: "You already created a session",
        });

      const [{ insertId }] = await ctx.db.insert(FlockActions).values({
        type: "UPDATE DESCRIPTION",
        creator: ctx.user.id,
        flockId: ctx.flock.id,
        publicId: nanoid(16),
      });
      await ctx.db
        .insert(FlockDetailsActions)
        .values({ description: input.description, actionId: insertId });
      await ctx.db
        .insert(FlockMemberVotes)
        .values({ actionId: insertId, vote: true, userId: ctx.user.id });
    }),
  getPosts: protectedProcedure
    .input(z.object({ name: z.string() }))
    .query(async ({ input, ctx }) => {
      return await ctx.db
        .select({
          picture: Posts.picture,
          description: Posts.description,
          likes: Posts.likes,
          publicId: Posts.publicId,
          createdAt: Posts.createdAt
        })
        .from(Posts)
        .innerJoin(Flocks, eq(Flocks.id, Posts.flockId))
        .where(eq(Flocks.name, input.name))
        .orderBy(desc(Posts.createdAt));
    }),
});
