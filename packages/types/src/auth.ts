import { z } from 'zod';
import { UUIDSchema, TimestampSchema } from './common.js';

// ---------------------------------------------------------------------------
// Profile — mirrors the public `profiles` table (wraps auth.users)
// ---------------------------------------------------------------------------

export const ProfileSchema = z.object({
  id: UUIDSchema,
  display_name: z.string().min(1).max(100).nullable(),
  avatar_url: z.string().url().nullable(),
  dark_mode_preference: z.enum(['system', 'dark', 'light']).default('dark'),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
});
export type Profile = z.infer<typeof ProfileSchema>;

export const UpdateProfileSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  avatar_url: z.string().url().nullable().optional(),
  dark_mode_preference: z.enum(['system', 'dark', 'light']).optional(),
});
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;

// ---------------------------------------------------------------------------
// Auth session (minimal shape for app state)
// ---------------------------------------------------------------------------

export const AuthSessionSchema = z.object({
  access_token: z.string(),
  refresh_token: z.string(),
  expires_at: z.number().int().describe('Unix timestamp'),
  user: z.object({
    id: UUIDSchema,
    email: z.string().email().nullable(),
    user_metadata: z.record(z.unknown()).default({}),
  }),
});
export type AuthSession = z.infer<typeof AuthSessionSchema>;
