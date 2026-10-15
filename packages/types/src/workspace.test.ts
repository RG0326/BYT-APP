import { describe, expect, it } from 'vitest';
import {
  CreateWorkspaceSchema,
  FeatureFlagNameSchema,
  InviteMemberSchema,
} from './workspace.js';

const workspaceId = '05b0d2ce-7020-4b2d-b6dc-c4dd2fedf872';

describe('CreateWorkspaceSchema', () => {
  it('applies the Portuguese operational defaults', () => {
    expect(CreateWorkspaceSchema.parse({ name: 'TYB', slug: 'tyb' })).toEqual({
      name: 'TYB',
      slug: 'tyb',
      iva_regime: 'isento_art53',
      timezone: 'Europe/Lisbon',
      currency: 'EUR',
    });
  });

  it('rejects unsafe slugs and malformed accent colours', () => {
    expect(CreateWorkspaceSchema.safeParse({ name: 'TYB', slug: 'TYB 3D' }).success).toBe(false);
    expect(
      CreateWorkspaceSchema.safeParse({ name: 'TYB', slug: 'tyb', accent_color: '#FFF' }).success,
    ).toBe(false);
  });
});

describe('workspace access inputs', () => {
  it('accepts only canonical roles and integration flags', () => {
    expect(
      InviteMemberSchema.safeParse({
        workspace_id: workspaceId,
        invited_email: 'rita@example.com',
        role: 'owner',
      }).success,
    ).toBe(true);
    expect(
      InviteMemberSchema.safeParse({
        workspace_id: workspaceId,
        invited_email: 'rita@example.com',
        role: 'admin',
      }).success,
    ).toBe(false);
    expect(FeatureFlagNameSchema.safeParse('shopify').success).toBe(true);
    expect(FeatureFlagNameSchema.safeParse('unknown').success).toBe(false);
  });
});
