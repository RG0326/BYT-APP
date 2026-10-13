-- =============================================================================
-- Migration: 20261013000003 — Phase 0: Workspace Invitations
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.workspace_invitations (
  id              UUID        NOT NULL DEFAULT gen_random_uuid(),
  workspace_id    UUID        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  invited_email   TEXT        NOT NULL CHECK (invited_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  role            TEXT        NOT NULL
                    CHECK (role IN ('owner', 'manager', 'operator', 'viewer')),
  token           TEXT        NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '48 hours',
  invited_by      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  used_at         TIMESTAMPTZ,
  used_by         UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  -- An invitation is either pending (used_at IS NULL) or consumed (used_at IS NOT NULL)
  CONSTRAINT workspace_invitations_used_check CHECK (
    (used_at IS NULL AND used_by IS NULL) OR
    (used_at IS NOT NULL AND used_by IS NOT NULL)
  )
);

-- Efficient lookup by token (used during invitation acceptance)
CREATE INDEX workspace_invitations_token_idx ON public.workspace_invitations(token);
-- Find pending, non-expired invitations quickly
CREATE INDEX workspace_invitations_workspace_pending_idx
  ON public.workspace_invitations(workspace_id, expires_at)
  WHERE used_at IS NULL;
-- Find invitations for a specific email
CREATE INDEX workspace_invitations_email_idx ON public.workspace_invitations(invited_email);

COMMENT ON TABLE public.workspace_invitations IS 'Invite-only access. Tokens are single-use, expire in 48h.';
COMMENT ON COLUMN public.workspace_invitations.token IS '64-char hex random token. Never expose in logs.';
COMMENT ON COLUMN public.workspace_invitations.used_at IS 'Set when invitation is accepted. NULL = still pending.';
