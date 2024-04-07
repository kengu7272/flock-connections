import { z } from "zod";

export const ProfileSchema = z.object({
  bio: z
    .string()
    .max(255)
    .refine((val) => !val.length || !!val.trim(), { message: "Empty Content" })
    .optional(),
  username: z
    .string()
    .max(16)
    .refine((val) => !val.includes(" "), { message: "Spaces aren't allowed" })
    .optional(),
});
export type ProfileSchemaType = z.infer<typeof ProfileSchema>;

export const FlockSchema = z
  .object({
    name: z
      .string()
      .min(1)
      .max(24)
      .refine((val) => !val.includes(" "), {
        message: "Name cannot contain spaces",
      }),
    description: z
      .string()
      .min(1)
      .max(500)
      .refine((val) => !!val.trim(), { message: "Must contain content" }),
  })
  .required();
export type FlockSchemaType = z.infer<typeof FlockSchema>;

export const MemberInviteSchema = z.object({
  username: z
    .string()
    .min(1)
    .max(24)
    .refine((val) => !val.includes(" "), {
      message: "Usernames don't include spaces",
    }),
});
export type MemberInviteSchemaType = z.infer<typeof MemberInviteSchema>;

export const PostCreationSchema = z.object({
  description: z.string().max(500),
});
export type PostCreationSchemaType = z.infer<typeof PostCreationSchema>;
