import {
  FlockMembers,
  Flocks,
  Posts,
  ProviderAccounts,
  Sessions,
  Users,
} from "./schema";

export type User = typeof Users.$inferSelect;
export type ProviderAccount = typeof ProviderAccounts.$inferSelect;
export type Session = typeof Sessions.$inferSelect;
export type Flock = typeof Flocks.$inferSelect;
export type FlockMember = typeof FlockMembers.$inferSelect;
export type Post = typeof Posts.$inferSelect;
