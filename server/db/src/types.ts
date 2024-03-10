import {
  GroupMembers,
  Groups,
  ProviderAccounts,
  Sessions,
  Users,
} from "./schema";

export type User = typeof Users.$inferSelect;
export type ProviderAccount = typeof ProviderAccounts.$inferSelect;
export type Session = typeof Sessions.$inferSelect;
export type Group = typeof Groups.$inferSelect;
export type GroupMember = typeof GroupMembers.$inferSelect;
