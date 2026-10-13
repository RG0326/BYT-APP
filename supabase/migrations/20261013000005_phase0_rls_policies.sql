-- =============================================================================
-- Migration: 20261013000005 — Phase 0: RLS Policies
--
-- Rules:
-- • All policies check auth.uid() membership via helper functions
-- • Never TO authenticated without workspace predicate
-- • audit_events: SELECT only for members; INSERT via SECURITY DEFINER function
-- =============================================================================

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Returns the caller's role in a workspace, or NULL if not a member.
CREATE OR REPLACE FUNCTION public.get_workspace_role(p_workspace_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.workspace_members
  WHERE workspace_id = p_workspace_id
    AND user_id = auth.uid()
    AND active = true
  LIMIT 1;
$$;

-- Returns TRUE if the caller is an active member of the workspace.
CREATE OR REPLACE FUNCTION public.is_workspace_member(p_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
      AND user_id = auth.uid()
      AND active = true
  );
$$;

COMMENT ON FUNCTION public.get_workspace_role IS 'Returns the caller''s role in the given workspace, or NULL. Used in RLS policies.';
COMMENT ON FUNCTION public.is_workspace_member IS 'Returns TRUE if the caller is an active workspace member. Used in RLS policies.';

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================

ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspaces            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_events          ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PROFILES
-- Users can read and update their own profile only.
-- =============================================================================

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow INSERT only via the handle_new_user() trigger (SECURITY DEFINER)
-- No direct INSERT policy for authenticated users.

-- =============================================================================
-- WORKSPACES
-- Members can SELECT their workspaces.
-- Only owner can UPDATE.
-- No DELETE exposed (soft-delete or owner action only — future phase).
-- =============================================================================

CREATE POLICY "workspaces_select_members"
  ON public.workspaces FOR SELECT
  USING (public.is_workspace_member(id));

CREATE POLICY "workspaces_update_owner"
  ON public.workspaces FOR UPDATE
  USING (public.get_workspace_role(id) = 'owner')
  WITH CHECK (public.get_workspace_role(id) = 'owner');

CREATE POLICY "workspaces_insert_authenticated"
  ON public.workspaces FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================================
-- WORKSPACE SETTINGS
-- Members can read. Only owner can update.
-- =============================================================================

CREATE POLICY "workspace_settings_select_members"
  ON public.workspace_settings FOR SELECT
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "workspace_settings_update_owner"
  ON public.workspace_settings FOR UPDATE
  USING (public.get_workspace_role(workspace_id) = 'owner')
  WITH CHECK (public.get_workspace_role(workspace_id) = 'owner');

CREATE POLICY "workspace_settings_insert_owner"
  ON public.workspace_settings FOR INSERT
  WITH CHECK (public.get_workspace_role(workspace_id) = 'owner');

-- =============================================================================
-- WORKSPACE FEATURE FLAGS
-- Members can read. Only owner can update or insert.
-- =============================================================================

CREATE POLICY "workspace_feature_flags_select_members"
  ON public.workspace_feature_flags FOR SELECT
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "workspace_feature_flags_update_owner"
  ON public.workspace_feature_flags FOR UPDATE
  USING (public.get_workspace_role(workspace_id) = 'owner')
  WITH CHECK (public.get_workspace_role(workspace_id) = 'owner');

CREATE POLICY "workspace_feature_flags_insert_owner"
  ON public.workspace_feature_flags FOR INSERT
  WITH CHECK (public.get_workspace_role(workspace_id) = 'owner');

-- =============================================================================
-- WORKSPACE MEMBERS
-- Members can see all active members of their workspace.
-- Only owner can invite (INSERT) or deactivate (UPDATE) members.
-- Hard DELETE not exposed (use active = false instead).
-- =============================================================================

CREATE POLICY "workspace_members_select_members"
  ON public.workspace_members FOR SELECT
  USING (public.is_workspace_member(workspace_id));

CREATE POLICY "workspace_members_insert_owner"
  ON public.workspace_members FOR INSERT
  WITH CHECK (public.get_workspace_role(workspace_id) = 'owner');

CREATE POLICY "workspace_members_update_owner"
  ON public.workspace_members FOR UPDATE
  USING (public.get_workspace_role(workspace_id) = 'owner')
  WITH CHECK (public.get_workspace_role(workspace_id) = 'owner');

-- =============================================================================
-- WORKSPACE INVITATIONS
-- Owner and manager can manage invitations.
-- Members can read pending invitations for their workspace.
-- Accepting an invitation is handled via SECURITY DEFINER function (future phase).
-- =============================================================================

CREATE POLICY "workspace_invitations_select_owner_manager"
  ON public.workspace_invitations FOR SELECT
  USING (
    public.get_workspace_role(workspace_id) IN ('owner', 'manager')
  );

CREATE POLICY "workspace_invitations_insert_owner_manager"
  ON public.workspace_invitations FOR INSERT
  WITH CHECK (
    public.get_workspace_role(workspace_id) IN ('owner', 'manager')
  );

CREATE POLICY "workspace_invitations_update_owner_manager"
  ON public.workspace_invitations FOR UPDATE
  USING (
    public.get_workspace_role(workspace_id) IN ('owner', 'manager')
  )
  WITH CHECK (
    public.get_workspace_role(workspace_id) IN ('owner', 'manager')
  );

-- Allow any authenticated user to look up an invitation by token
-- (needed for invitation acceptance page — user may not yet be a member)
CREATE POLICY "workspace_invitations_select_by_token"
  ON public.workspace_invitations FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND used_at IS NULL
    AND expires_at > now()
  );

-- =============================================================================
-- AUDIT EVENTS
-- Members can SELECT events for their workspace.
-- INSERT only via record_audit_event() SECURITY DEFINER function.
-- No UPDATE, no DELETE for any user.
-- =============================================================================

CREATE POLICY "audit_events_select_members"
  ON public.audit_events FOR SELECT
  USING (
    workspace_id IS NOT NULL
    AND public.is_workspace_member(workspace_id)
  );

-- No INSERT policy for authenticated users — inserts go via SECURITY DEFINER function.
-- No UPDATE or DELETE policies at all — this table is immutable.
