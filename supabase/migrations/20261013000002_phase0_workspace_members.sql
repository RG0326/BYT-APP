-- =============================================================================
-- Migration: 20261013000002 — Phase 0: Workspace Members
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.workspace_members (
  id            UUID        NOT NULL DEFAULT gen_random_uuid(),
  workspace_id  UUID        NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role          TEXT        NOT NULL
                  CHECK (role IN ('owner', 'manager', 'operator', 'viewer')),
  joined_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  invited_by    UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  active        BOOLEAN     NOT NULL DEFAULT true,
  PRIMARY KEY (id),
  CONSTRAINT workspace_members_workspace_user_unique UNIQUE (workspace_id, user_id)
);

-- Indexes for the most common query patterns
CREATE INDEX workspace_members_workspace_id_idx ON public.workspace_members(workspace_id);
CREATE INDEX workspace_members_user_id_idx ON public.workspace_members(user_id);
CREATE INDEX workspace_members_active_idx ON public.workspace_members(workspace_id, active) WHERE active = true;

COMMENT ON TABLE public.workspace_members IS 'Maps users to workspaces with roles. Invite-only access.';
COMMENT ON COLUMN public.workspace_members.role IS 'owner > manager > operator > viewer. Only one owner per workspace at a time (enforced by app logic).';
COMMENT ON COLUMN public.workspace_members.active IS 'Soft-deactivate instead of DELETE to preserve audit history.';
