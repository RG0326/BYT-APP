# BYT 3D

Business management app for a 3D printing operation. Manages two workspaces — **TYB** and **Gally** — with shared physical assets, isolated financials, and invite-only access.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS v3 + shadcn/ui |
| State / Queries | TanStack Query v5 |
| Backend | Supabase (Auth, Postgres, Storage, Realtime) |
| Validation | Zod v3 |
| Testing | Vitest |
| Monorepo | pnpm workspaces |

## Workspaces

| Workspace | Accent | IVA Regime |
|-----------|--------|-----------|
| TYB | `#FFE050` | isento_art53 |
| Gally | `#6366f1` | isento_art53 |

## Getting started

```bash
# 1. Install dependencies
pnpm install

# 2. Copy env vars and fill in your Supabase project values
cp apps/web/.env.example apps/web/.env.local

# 3. Start local Supabase (requires supabase CLI + Docker)
supabase start

# 4. Run migrations + seed
supabase db reset

# 5. Start the dev server
pnpm dev
```

## Project structure

```
apps/web/          React + Vite frontend
packages/types/    Shared Zod schemas + TypeScript types
supabase/          Migrations, seed, local config
docs/decisions/    Architecture Decision Records (ADRs)
```

## Rules

See [AGENTS.md](./AGENTS.md) for canonical implementation rules that all contributors and AI agents must follow.

## ADRs

| ID | Title |
|----|-------|
| [ADR-001](docs/decisions/ADR-001-printer-workspace-sharing.md) | Printer workspace sharing |
| [ADR-002](docs/decisions/ADR-002-monetary-representation.md) | Monetary representation |
| [ADR-003](docs/decisions/ADR-003-inventory-ledger-model.md) | Inventory ledger model |
| [ADR-004](docs/decisions/ADR-004-margin-calculation-iva.md) | Margin calculation and IVA |
| [ADR-005](docs/decisions/ADR-005-3d-file-storage.md) | 3D file storage |

## License

Private — all rights reserved.
