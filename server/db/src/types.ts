import { Sessions, Users } from "./schema";

export const User = Users.$inferSelect;
export const Session = Sessions.$inferSelect;
