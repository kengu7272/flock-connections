import { faker } from "@faker-js/faker";
import { eq, ne } from "drizzle-orm";

import { db } from "./server/db";
import { FlockMembers, Flocks, Users } from "./server/db/src/schema";

const addUsers = async () => {
  const users: { username: string; picture: string; email: string }[] = [];
  for (let i = 0; i < 10; ++i) {
    const username = faker.internet.userName();
    const picture = faker.image.url();
    const email = faker.internet.email();

    users.push({ username, picture, email });
  }

  await db.insert(Users).values(users);
};

const addToFlock = async () => {
  const [kevinsFlock] = await db
    .select()
    .from(Flocks)
    .where(eq(Flocks.name, "The Flock"));

  const users = await db
    .select()
    .from(Users)
    .where(ne(Users.username, "Kevin"));

  const flockId = kevinsFlock.id;
  const usersList: { userId: number; flockId: number }[] = [];
  for (const user of users) usersList.push({ flockId, userId: user.id });

  await db.insert(FlockMembers).values(usersList);
};

await addUsers();
await addToFlock();
console.log("done");
