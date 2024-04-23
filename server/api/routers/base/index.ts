import { and, desc, eq, isNull, lte, ne } from "drizzle-orm";
import { z } from "zod";

import {
  FlockMembers,
  Flocks,
  PostLikes,
  Posts,
  PostViews,
  Users,
} from "~/server/db/src/schema";
import { protectedProcedure, publicProcedure, router } from "~/server/trpc";

export const baseRouter = router({
  loggedIn: publicProcedure.query(({ ctx }) => {
    if (!ctx.user) return { loggedIn: false };

    return {
      loggedIn: true,
      username: ctx.user.username,
      picture: ctx.user.picture,
    };
  }),
  userInfo: protectedProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input, ctx }) => {
      const [userInfo] = await ctx.db
        .select({
          user: {
            username: Users.username,
            picture: Users.picture,
            bio: Users.bio,
            joined: Users.joined,
            email: Users.email,
          },
          flock: {
            name: Flocks.name,
          },
        })
        .from(Users)
        .leftJoin(FlockMembers, eq(FlockMembers.userId, Users.id))
        .leftJoin(Flocks, eq(Flocks.id, FlockMembers.flockId))
        .where(eq(Users.username, input.username));

      return { userInfo, owner: userInfo.user.username === ctx.user?.username };
    }),
  homePosts: protectedProcedure
    .input(
      z.object({
        cursor: z.number().nullish(), // <-- "cursor" needs to exist, but can be any type
      }),
    )
    .query(async ({ input, ctx }) => {
      const { cursor } = input;

      const posts = await ctx.db
        .select({
          post: {
            id: Posts.id,
            picture: Posts.picture,
            description: Posts.description,
            likes: Posts.likes,
            publicId: Posts.publicId,
            createdAt: Posts.createdAt,
          },
          flock: {
            name: Flocks.name,
            picture: Flocks.picture,
          },
          userLiked: PostLikes.userId,
          userViewed: PostViews.userId,
        })
        .from(Posts)
        .innerJoin(Flocks, eq(Flocks.id, Posts.flockId))
        .leftJoin(
          PostLikes,
          and(
            eq(PostLikes.postId, Posts.id),
            eq(PostLikes.userId, ctx.user.id),
          ),
        )
        .leftJoin(
          PostViews,
          and(
            eq(PostViews.postId, Posts.id),
            eq(PostViews.userId, ctx.user.id),
          ),
        )
        .where(
          and(
            ne(Posts.flockId, ctx.flock?.id ?? -1),
            cursor ? lte(Posts.id, cursor) : undefined,
            isNull(PostViews.userId),
          ),
        )
        .orderBy(desc(Posts.id))
        .limit(8);

      let nextCursor = undefined;
      if (posts.length > 7) {
        const nextItem = posts.pop();
        nextCursor = nextItem!.post.id;
      }

      const formatted = posts.map((post) => ({
        ...post,
        userLiked: !!post.userLiked,
        userViewed: !!post.userViewed,
      }));

      return { posts: formatted, nextCursor };
    }),
});
