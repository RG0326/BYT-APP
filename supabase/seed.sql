-- =============================================================================
-- BYT 3D — Development Seed Data
-- Run after: supabase db reset
-- Seeds: 2 workspaces (TYB + Gally) + feature flags
--
-- NOTE: This seed does NOT create auth.users rows (that requires a real
-- Supabase Auth flow or the Supabase local admin API). The workspace rows
-- are seeded without an owner FK to allow local development without a
-- real user account. Set created_by after your first Google OAuth login.
-- =============================================================================

-- Clean up existing seed data (idempotent)
DELETE FROM workspace_feature_flags WHERE workspace_id IN (
  SELECT id FROM workspaces WHERE slug IN ('tyb', 'gally')
);
DELETE FROM workspace_settings WHERE workspace_id IN (
  SELECT id FROM workspaces WHERE slug IN ('tyb', 'gally')
);
DELETE FROM workspaces WHERE slug IN ('tyb', 'gally');

-- ---------------------------------------------------------------------------
-- Workspaces
-- ---------------------------------------------------------------------------

INSERT INTO workspaces (id, name, slug, accent_color, iva_regime, timezone, currency, created_at, updated_at, created_by)
VALUES
  (
    'a1000000-0000-4000-8000-000000000001',
    'TYB',
    'tyb',
    '#FFE050',
    'isento_art53',
    'Europe/Lisbon',
    'EUR',
    now(),
    now(),
    NULL  -- set to your user ID after first login
  ),
  (
    'a2000000-0000-4000-8000-000000000002',
    'Gally',
    'gally',
    '#6366f1',
    'isento_art53',
    'Europe/Lisbon',
    'EUR',
    now(),
    now(),
    NULL  -- set to your user ID after first login
  );

-- ---------------------------------------------------------------------------
-- Workspace Settings (default values)
-- ---------------------------------------------------------------------------

INSERT INTO workspace_settings (id, workspace_id, energy_cost_per_kwh, labour_rate_per_hour, default_margin_target, default_margin_minimum, updated_at, updated_by)
VALUES
  (
    gen_random_uuid(),
    'a1000000-0000-4000-8000-000000000001',
    0.2200,   -- €0.22/kWh — approximate PT residential rate
    8.00,     -- €8.00/hr — adjust to actual rate
    0.40,     -- 40% target margin
    0.25,     -- 25% minimum margin
    now(),
    NULL
  ),
  (
    gen_random_uuid(),
    'a2000000-0000-4000-8000-000000000002',
    0.2200,
    8.00,
    0.40,
    0.25,
    now(),
    NULL
  );

-- ---------------------------------------------------------------------------
-- Feature Flags — all disabled by default
-- Enable manually per workspace once integrations are ready
-- ---------------------------------------------------------------------------

INSERT INTO workspace_feature_flags (id, workspace_id, flag_name, enabled, updated_at)
SELECT
  gen_random_uuid(),
  w.id,
  f.flag_name,
  false,
  now()
FROM
  workspaces w,
  (VALUES ('shopify'), ('orfio'), ('hermes')) AS f(flag_name)
WHERE
  w.slug IN ('tyb', 'gally');
