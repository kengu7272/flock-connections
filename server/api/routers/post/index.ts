import { TRPCError } from "@trpc/server";
import { and, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

import {
  PostCommentLikes,
  PostComments,
  PostLikes,
  Posts,
  PostViews,
  Users,
} from "~/server/db/src/schema";
import { protectedProcedure, router } from "~/server/trpc";
import { PostCommentSchema } from "~/server/validation";

export const postRouter = router({
  like: protectedProcedure
    .input(z.object({ postPublicId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [{ postId, likes }] = await ctx.db
        .select({ postId: Posts.id, likes: Posts.likes })
        .from(Posts)
        .where(eq(Posts.publicId, input.postPublicId));

      const [previousLike] = await ctx.db
        .select({ id: PostLikes.id })
        .from(PostLikes)
        .where(
          and(eq(PostLikes.postId, postId), eq(PostLikes.userId, ctx.user.id)),
        );

      if (previousLike) {
        await ctx.db.delete(PostLikes).where(eq(PostLikes.id, previousLike.id));
        await ctx.db
          .update(Posts)
          .set({ likes: likes - 1 })
          .where(eq(Posts.id, postId));
        return "Unliked";
      }

      await ctx.db
        .insert(PostLikes)
        .values({ publicId: nanoid(16), postId, userId: ctx.user.id });
      await ctx.db
        .update(Posts)
        .set({ likes: likes + 1 })
        .where(eq(Posts.id, postId));

      return "Liked";
    }),
  view: protectedProcedure
    .input(z.object({ postPublicId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [{ postId, user }] = await ctx.db
        .select({ postId: Posts.id, user: PostViews.userId })
        .from(Posts)
        .leftJoin(
          PostViews,
          and(
            eq(PostViews.postId, Posts.id),
            eq(PostViews.userId, ctx.user.id),
          ),
        )
        .where(eq(Posts.publicId, input.postPublicId));
      if (user)
        throw new TRPCError({
          code: "CONFLICT",
          message: "User Already Viewed",
        });

      await ctx.db
        .insert(PostViews)
        .values({ userId: ctx.user.id, postId, publicId: nanoid(16) });
    }),
  comment: protectedProcedure
    .input(
      z.intersection(PostCommentSchema, z.object({ postPublicId: z.string() })),
    )
    .mutation(async ({ input, ctx }) => {
      const [{ id }] = await ctx.db
        .select()
        .from(Posts)
        .where(eq(Posts.publicId, input.postPublicId));
      await ctx.db.insert(PostComments).values({
        comment: input.comment,
        publicId: nanoid(16),
        userId: ctx.user.id,
        postId: id,
      });
    }),
  getComments: protectedProcedure
    .input(z.object({ postPublicId: z.string(), cursor: z.number().nullish() }))
    .query(async ({ input, ctx }) => {
      const [{ id }] = await ctx.db
        .select({ id: Posts.id })
        .from(Posts)
        .where(eq(Posts.publicId, input.postPublicId));
      const comments = await ctx.db
        .select({
          comment: {
            publicId: PostComments.publicId,
            text: PostComments.comment,
            likes: PostComments.likes,
            userLiked: PostCommentLikes.userId,
          },
          user: { username: Users.username, picture: Users.picture },
        })
        .from(PostComments)
        .innerJoin(Users, eq(Users.id, PostComments.userId))
        .leftJoin(
          PostCommentLikes,
          and(
            eq(PostCommentLikes.commentId, PostComments.id),
            eq(PostCommentLikes.userId, ctx.user.id),
          ),
        )
        .where(eq(PostComments.postId, id))
        .orderBy(desc(PostComments.likes), desc(PostComments.id))
        .limit(8)
        .offset(input.cursor ?? 0);

      let nextCursor = undefined;
      if (comments.length > 7) {
        comments.pop();
        nextCursor = (input.cursor ?? 0) + 7;
      }

      const formatted = comments.map((comment) => ({
        ...comment,
        comment: { ...comment.comment, userLiked: !!comment.comment.userLiked },
      }));

      return { comments: formatted, nextCursor };
    }),
  likeComment: protectedProcedure
    .input(z.object({ commentPublicId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const [{ commentId, likes }] = await ctx.db
        .select({ commentId: PostComments.id, likes: PostComments.likes })
        .from(PostComments)
        .where(eq(PostComments.publicId, input.commentPublicId));

      const [previousLike] = await ctx.db
        .select({ id: PostCommentLikes.id })
        .from(PostCommentLikes)
        .where(
          and(
            eq(PostCommentLikes.commentId, commentId),
            eq(PostCommentLikes.userId, ctx.user.id),
          ),
        );

      if (previousLike) {
        await ctx.db
          .delete(PostCommentLikes)
          .where(eq(PostCommentLikes.id, previousLike.id));
        await ctx.db
          .update(PostComments)
          .set({ likes: likes - 1 })
          .where(eq(PostComments.id, commentId));
        return "Unliked";
      }

      await ctx.db
        .insert(PostCommentLikes)
        .values({ publicId: nanoid(16), commentId, userId: ctx.user.id });
      await ctx.db
        .update(PostComments)
        .set({ likes: likes + 1 })
        .where(eq(PostComments.id, commentId));

      return "Liked";
    }),
});
