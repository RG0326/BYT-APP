-- =============================================================================
-- Migration: 20261013000001 — Phase 0: Profiles + Workspaces
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================================
-- PROFILES
-- Public profiles table that mirrors auth.users.
-- Created automatically via trigger on auth.users insert.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id                    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name          TEXT        CHECK (char_length(display_name) <= 100),
  avatar_url            TEXT,
  dark_mode_preference  TEXT        NOT NULL DEFAULT 'dark'
                          CHECK (dark_mode_preference IN ('system', 'dark', 'light')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

COMMENT ON TABLE public.profiles IS 'Public user profiles, one per auth.users row.';
COMMENT ON COLUMN public.profiles.dark_mode_preference IS 'User dark mode preference. Default dark — app is dark by default.';

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- WORKSPACES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.workspaces (
  id            UUID        NOT NULL DEFAULT gen_random_uuid(),
  name          TEXT        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  slug          TEXT        NOT NULL CHECK (slug ~ '^[a-z0-9-]+$' AND char_length(slug) BETWEEN 1 AND 63),
  logo_url      TEXT,
  accent_color  TEXT        NOT NULL DEFAULT '#6366f1'
                  CHECK (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  iva_regime    TEXT        NOT NULL DEFAULT 'isento_art53'
                  CHECK (iva_regime IN ('isento_art53', 'regime_normal')),
  timezone      TEXT        NOT NULL DEFAULT 'Europe/Lisbon',
  currency      TEXT        NOT NULL DEFAULT 'EUR'
                  CHECK (char_length(currency) = 3),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by    UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  PRIMARY KEY (id)
);

CREATE UNIQUE INDEX workspaces_slug_idx ON public.workspaces(slug);

COMMENT ON TABLE public.workspaces IS 'Isolated business workspaces (TYB, Gally).';
COMMENT ON COLUMN public.workspaces.iva_regime IS 'PT tax regime. isento_art53 = Art.53 CIVA exemption (default). See ADR-004.';
COMMENT ON COLUMN public.workspaces.accent_color IS 'Brand accent color for workspace UI theming.';

CREATE TRIGGER workspaces_set_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- WORKSPACE SETTINGS
-- One row per workspace. Created automatically when workspace is created.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.workspace_settings (
  id                      UUID         NOT NULL DEFAULT gen_random_uuid(),
  workspace_id            UUID         NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  energy_cost_per_kwh     NUMERIC(10,4) CHECK (energy_cost_per_kwh >= 0),
  labour_rate_per_hour    NUMERIC(10,2) CHECK (labour_rate_per_hour >= 0),
  default_margin_target   NUMERIC(5,4)  CHECK (default_margin_target BETWEEN 0 AND 1),
  default_margin_minimum  NUMERIC(5,4)  CHECK (default_margin_minimum BETWEEN 0 AND 1),
  updated_at              TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_by              UUID         REFERENCES public.profiles(id) ON DELETE SET NULL,
  PRIMARY KEY (id)
);

CREATE UNIQUE INDEX workspace_settings_workspace_id_idx ON public.workspace_settings(workspace_id);

COMMENT ON TABLE public.workspace_settings IS 'Per-workspace operational settings for cost calculations.';
COMMENT ON COLUMN public.workspace_settings.default_margin_target IS 'Target margin as a decimal fraction (e.g. 0.40 = 40%). See ADR-004.';
COMMENT ON COLUMN public.workspace_settings.energy_cost_per_kwh IS 'Local energy cost in EUR per kWh. No float — use NUMERIC. See ADR-002.';

CREATE TRIGGER workspace_settings_set_updated_at
  BEFORE UPDATE ON public.workspace_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- WORKSPACE FEATURE FLAGS
-- Feature toggles per workspace. All disabled by default.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.workspace_feature_flags (
  id            UUID        NOT NULL DEFAULT gen_random_uuid(),
  workspace_id  UUID        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  flag_name     TEXT        NOT NULL CHECK (flag_name IN ('shopify', 'orfio', 'hermes')),
  enabled       BOOLEAN     NOT NULL DEFAULT false,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE UNIQUE INDEX workspace_feature_flags_workspace_flag_idx
  ON public.workspace_feature_flags(workspace_id, flag_name);

COMMENT ON TABLE public.workspace_feature_flags IS 'Feature flags per workspace. Integrations off by default.';

CREATE TRIGGER workspace_feature_flags_set_updated_at
  BEFORE UPDATE ON public.workspace_feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
