import { z } from 'zod';
import { UUIDSchema, TimestampSchema, IvaRegimeSchema, WorkspaceRoleSchema } from './common.js';

// ---------------------------------------------------------------------------
// Workspace
// ---------------------------------------------------------------------------

export const WorkspaceSchema = z.object({
  id: UUIDSchema,
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(63).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  logo_url: z.string().url().nullable(),
  accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a 6-digit hex color').default('#6366f1'),
  iva_regime: IvaRegimeSchema,
  timezone: z.string().default('Europe/Lisbon'),
  currency: z.string().length(3).default('EUR'),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
  created_by: UUIDSchema,
});
export type Workspace = z.infer<typeof WorkspaceSchema>;

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(63).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  logo_url: z.string().url().optional().nullable(),
  accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  iva_regime: IvaRegimeSchema.optional().default('isento_art53'),
  timezone: z.string().optional().default('Europe/Lisbon'),
  currency: z.string().length(3).optional().default('EUR'),
});
export type CreateWorkspace = z.infer<typeof CreateWorkspaceSchema>;

// ---------------------------------------------------------------------------
// Workspace Settings
// ---------------------------------------------------------------------------

export const WorkspaceSettingsSchema = z.object({
  id: UUIDSchema,
  workspace_id: UUIDSchema,
  energy_cost_per_kwh: z.number().nonnegative().nullable(),
  labour_rate_per_hour: z.number().nonnegative().nullable(),
  default_margin_target: z.number().min(0).max(1).nullable().describe('Decimal fraction, e.g. 0.40 = 40%'),
  default_margin_minimum: z.number().min(0).max(1).nullable().describe('Decimal fraction, e.g. 0.20 = 20%'),
  updated_at: TimestampSchema,
  updated_by: UUIDSchema,
});
export type WorkspaceSettings = z.infer<typeof WorkspaceSettingsSchema>;

// ---------------------------------------------------------------------------
// Workspace Member
// ---------------------------------------------------------------------------

export const WorkspaceMemberSchema = z.object({
  id: UUIDSchema,
  workspace_id: UUIDSchema,
  user_id: UUIDSchema,
  role: WorkspaceRoleSchema,
  joined_at: TimestampSchema,
  invited_by: UUIDSchema.nullable(),
  active: z.boolean().default(true),
});
export type WorkspaceMember = z.infer<typeof WorkspaceMemberSchema>;

// ---------------------------------------------------------------------------
// Workspace Invitation
// ---------------------------------------------------------------------------

export const WorkspaceInvitationSchema = z.object({
  id: UUIDSchema,
  workspace_id: UUIDSchema,
  invited_email: z.string().email(),
  role: WorkspaceRoleSchema,
  token: z.string().min(64),
  expires_at: TimestampSchema,
  invited_by: UUIDSchema,
  used_at: TimestampSchema.nullable(),
  used_by: UUIDSchema.nullable(),
  created_at: TimestampSchema,
});
export type WorkspaceInvitation = z.infer<typeof WorkspaceInvitationSchema>;

export const InviteMemberSchema = z.object({
  workspace_id: UUIDSchema,
  invited_email: z.string().email(),
  role: WorkspaceRoleSchema,
});
export type InviteMember = z.infer<typeof InviteMemberSchema>;

export const AcceptInvitationSchema = z.object({
  token: z.string().min(64),
});
export type AcceptInvitation = z.infer<typeof AcceptInvitationSchema>;

// ---------------------------------------------------------------------------
// Workspace Feature Flags
// ---------------------------------------------------------------------------

export const WorkspaceFeatureFlagSchema = z.object({
  id: UUIDSchema,
  workspace_id: UUIDSchema,
  flag_name: z.string().min(1),
  enabled: z.boolean().default(false),
  updated_at: TimestampSchema,
});
export type WorkspaceFeatureFlag = z.infer<typeof WorkspaceFeatureFlagSchema>;

export const FeatureFlagNameSchema = z.enum(['shopify', 'orfio', 'hermes']);
export type FeatureFlagName = z.infer<typeof FeatureFlagNameSchema>;
