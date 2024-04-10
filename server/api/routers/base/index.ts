import { and, desc, eq, lte, ne } from "drizzle-orm";
import { z } from "zod";

import { FlockMembers, Flocks, Posts, Users } from "~/server/db/src/schema";
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
        })
        .from(Posts)
        .innerJoin(Flocks, eq(Flocks.id, Posts.flockId))
        .where(
          and(
            ne(Posts.flockId, ctx.flock?.id ?? -1),
            cursor ? lte(Posts.id, cursor) : undefined,
          ),
        )
        .orderBy(desc(Posts.id))
        .limit(8);

      let nextCursor = undefined;
      if (posts.length > 7) {
        const nextItem = posts.pop();
        nextCursor = nextItem!.post.id;
      }

      return { posts, nextCursor };
    }),
});
