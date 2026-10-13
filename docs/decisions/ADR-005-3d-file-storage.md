# ADR-005: 3D File Storage

**Date:** 2026-10-13  
**Status:** Accepted  
**Deciders:** Rita (owner)

---

## Context

BYT 3D needs to store and serve 3D print files: `.stl`, `.3mf`, `.step`, `.gcode`. These files can be large (up to hundreds of MB), contain proprietary designs, and must not be publicly accessible. We use Supabase on the Free tier (1 GB Storage limit).

---

## Decision

**Private Supabase Storage bucket only. Access via short-lived signed URLs. No public permanent URLs.**

### Storage rules

1. **Private bucket only.** The `3d-files` bucket is private. No public access policy.
2. **Signed URLs for access.** All file access (download, preview) uses signed URLs with **maximum 1 hour expiry**. Signed URL generation requires a workspace membership check.
3. **SHA-256 checksum for deduplication.** Every uploaded file has its SHA-256 checksum stored. Before upload, check if the checksum already exists for the workspace — avoid duplicate storage.
4. **File type validation is server-side only.** Accepted types: `.stl`, `.3mf`, `.step`, `.gcode`. Client MIME type is never trusted. Validation happens in an Edge Function or Postgres trigger after upload.
5. **Quarantine on upload.** Newly uploaded files have `status = 'quarantined'` until basic validation passes (file type, size, checksum). Only after validation does status become `'active'`.
6. **50 MB max per upload.** Enforced to stay within Supabase Free 1 GB limit. This applies to individual file uploads — not workspace total (which requires a separate quota check).
7. **Never send to external AI services.** STL/3MF/G-code files must never be sent to external AI APIs (OpenAI, Anthropic, etc.) without explicit user consent per file.

### Storage path structure

```
{workspace_id}/{entity_type}/{entity_id}/{filename_with_checksum_prefix}
```

Example:
```
abc123-workspace-id/products/def456-product-id/a1b2c3d4-my-design.3mf
```

---

## Consequences

### Positive
- No proprietary designs accessible without authentication
- Signed URL expiry limits exposure if a URL is leaked
- Deduplication saves storage on the Free tier
- Quarantine prevents corrupt or malicious files from entering the system

### Negative
- Every file access requires a round-trip to generate a signed URL (slight latency)
- Validation pipeline adds complexity (Edge Function needed)
- 50 MB limit may be too small for complex multi-part G-code files — revisit if needed

---

## Enforcement

- Supabase Storage bucket policy: private (no `anon` read access)
- Edge Function: validates file type by magic bytes, not MIME
- `files` table: `sha256_checksum TEXT NOT NULL`, `status TEXT NOT NULL DEFAULT 'quarantined'`
- Application code: signed URL generation always checks `is_workspace_member(workspace_id)` first
- Upload size limit: enforced both client-side (UX) and server-side (Edge Function rejects > 50 MB)
