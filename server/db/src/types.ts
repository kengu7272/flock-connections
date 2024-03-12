import {
  FlockMembers,
  Flocks,
  ProviderAccounts,
  Sessions,
  Users,
} from "./schema";

export type User = typeof Users.$inferSelect;
export type ProviderAccount = typeof ProviderAccounts.$inferSelect;
export type Session = typeof Sessions.$inferSelect;
export type Group = typeof Flocks.$inferSelect;
export type GroupMember = typeof FlockMembers.$inferSelect;
