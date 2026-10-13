-- =============================================================================
-- Migration: 20261013000004 — Phase 0: Audit Events
-- Append-only. No UPDATE, no DELETE. Inserts via SECURITY DEFINER function only.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.audit_events (
  id              UUID        NOT NULL DEFAULT gen_random_uuid(),
  workspace_id    UUID        REFERENCES public.workspaces(id) ON DELETE SET NULL,
  actor_id        UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  action          TEXT        NOT NULL CHECK (char_length(action) BETWEEN 1 AND 200),
  entity_type     TEXT        NOT NULL CHECK (char_length(entity_type) BETWEEN 1 AND 100),
  entity_id       UUID,
  payload_before  JSONB,
  payload_after   JSONB,
  source          TEXT        NOT NULL DEFAULT 'ui'
                    CHECK (source IN ('ui', 'shopify', 'orfio', 'hermes', 'system')),
  correlation_id  UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Time-ordered queries per workspace (most common: "show recent activity")
CREATE INDEX audit_events_workspace_created_idx
  ON public.audit_events(workspace_id, created_at DESC)
  WHERE workspace_id IS NOT NULL;

-- Entity history queries (e.g. "show all changes to this workspace")
CREATE INDEX audit_events_entity_idx
  ON public.audit_events(entity_type, entity_id);

-- Correlation queries (e.g. "show all events from this webhook batch")
CREATE INDEX audit_events_correlation_idx
  ON public.audit_events(correlation_id)
  WHERE correlation_id IS NOT NULL;

COMMENT ON TABLE public.audit_events IS 'Immutable audit log. Append-only — no UPDATE or DELETE. See AGENTS.md.';
COMMENT ON COLUMN public.audit_events.action IS 'Verb phrase, e.g. "workspace.created", "member.invited", "order.fulfilled".';
COMMENT ON COLUMN public.audit_events.source IS 'Origin of the change: ui | shopify | orfio | hermes | system.';
COMMENT ON COLUMN public.audit_events.correlation_id IS 'Groups related events from a single operation (e.g. one webhook payload).';

-- =============================================================================
-- SECURITY DEFINER function to insert audit events
-- Normal users call this function; they never INSERT directly.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.record_audit_event(
  p_workspace_id    UUID,
  p_actor_id        UUID,
  p_action          TEXT,
  p_entity_type     TEXT,
  p_entity_id       UUID DEFAULT NULL,
  p_payload_before  JSONB DEFAULT NULL,
  p_payload_after   JSONB DEFAULT NULL,
  p_source          TEXT DEFAULT 'ui',
  p_correlation_id  UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.audit_events (
    workspace_id, actor_id, action, entity_type, entity_id,
    payload_before, payload_after, source, correlation_id
  )
  VALUES (
    p_workspace_id, p_actor_id, p_action, p_entity_type, p_entity_id,
    p_payload_before, p_payload_after, p_source, p_correlation_id
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$;

COMMENT ON FUNCTION public.record_audit_event IS 'SECURITY DEFINER insert into audit_events. Use this instead of direct INSERT.';

-- Revoke direct INSERT from authenticated users (belt + suspenders with RLS)
REVOKE INSERT, UPDATE, DELETE ON public.audit_events FROM authenticated;
