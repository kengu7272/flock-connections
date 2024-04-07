import { and, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";

import { PostLikes, Posts } from "~/server/db/src/schema";
import { protectedProcedure, router } from "~/server/trpc";

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
});
