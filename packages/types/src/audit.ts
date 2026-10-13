import { z } from 'zod';
import { UUIDSchema, TimestampSchema } from './common.js';

// ---------------------------------------------------------------------------
// Audit source
// ---------------------------------------------------------------------------

export const AuditSourceSchema = z.enum(['ui', 'shopify', 'orfio', 'hermes', 'system']);
export type AuditSource = z.infer<typeof AuditSourceSchema>;

// ---------------------------------------------------------------------------
// Audit event — append-only, no UPDATE or DELETE. See ADR (AGENTS.md rule #2)
// ---------------------------------------------------------------------------

export const AuditEventSchema = z.object({
  id: UUIDSchema,
  workspace_id: UUIDSchema.nullable().describe('Null for system-level events not tied to a workspace'),
  actor_id: UUIDSchema.nullable().describe('Null for automated system events'),
  action: z.string().min(1).describe('Verb describing what happened, e.g. "workspace.created"'),
  entity_type: z.string().min(1).describe('The table/domain entity affected, e.g. "workspace"'),
  entity_id: UUIDSchema.nullable().describe('PK of the affected row'),
  payload_before: z.record(z.unknown()).nullable().describe('State before the change (for updates)'),
  payload_after: z.record(z.unknown()).nullable().describe('State after the change'),
  source: AuditSourceSchema,
  correlation_id: UUIDSchema.nullable().describe('Group related events, e.g. all events from one webhook'),
  created_at: TimestampSchema,
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;

// ---------------------------------------------------------------------------
// Input for creating an audit event (via SECURITY DEFINER function only)
// Normal users never INSERT directly into audit_events.
// ---------------------------------------------------------------------------

export const CreateAuditEventSchema = z.object({
  workspace_id: UUIDSchema.nullable().optional(),
  actor_id: UUIDSchema.nullable().optional(),
  action: z.string().min(1),
  entity_type: z.string().min(1),
  entity_id: UUIDSchema.nullable().optional(),
  payload_before: z.record(z.unknown()).nullable().optional(),
  payload_after: z.record(z.unknown()).nullable().optional(),
  source: AuditSourceSchema.default('ui'),
  correlation_id: UUIDSchema.nullable().optional(),
});
export type CreateAuditEvent = z.infer<typeof CreateAuditEventSchema>;
