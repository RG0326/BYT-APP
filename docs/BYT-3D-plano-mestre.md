# BYT 3D — Plano Mestre

Este documento é um resumo de referência do plano mestre do projeto BYT 3D. O plano completo vive nas sessões de Hermes e nos ADRs em `docs/decisions/`.

---

## Visão Geral

BYT 3D é uma aplicação de gestão de negócio para impressão 3D, com dois workspaces:
- **TYB** — workspace principal
- **Gally** — workspace secundário

A aplicação gere: catálogo de produtos, inventário de materiais, custos de produção, encomendas, integração com Shopify, e integração contabilística com ORFIO.

---

## Fases de Implementação

| Fase | Âmbito | Estado |
|------|--------|--------|
| 0 | Auth + Workspaces | 🟡 Em progresso |
| 1 | Catálogo | ⬜ Pendente |
| 2 | Ledger de Inventário | ⬜ Pendente |
| 3 | Custos | ⬜ Pendente |
| 4 | Encomendas + Produção | ⬜ Pendente |
| 5 | Integração Shopify | ⬜ Pendente |
| 6 | Integração ORFIO | ⬜ Pendente |
| 7 | Ferramentas Hermes | ⬜ Pendente |

---

## Decisões Arquiteturais

Ver `docs/decisions/` para os ADRs completos.

| ADR | Decisão |
|-----|---------|
| ADR-001 | Impressora X2D registada em ambos os workspaces com `shared_asset=true` |
| ADR-002 | Valores monetários como inteiros (cêntimos) + código de moeda ISO 4217 |
| ADR-003 | Ledger append-only para inventário; balances são projeções reconstruíveis |
| ADR-004 | `iva_regime` por workspace; distinção clara entre margem e markup |
| ADR-005 | Storage privado Supabase; URLs assinadas (máx. 1h); validação server-side |

---

## Regras Absolutas

Ver [AGENTS.md](../AGENTS.md) para a lista completa. Resumo:

- Nunca dois sources of truth editáveis
- Nunca atualizar stock sem movimento de inventário
- Nunca recalcular histórico com custos atuais
- Nunca tratar payout Shopify como receita
- Nunca expor service_role ao cliente ou ao Hermes
- Nunca processar webhooks sem HMAC e deduplicação

---

## Stack Técnica

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS v3 + shadcn/ui
- **Queries**: TanStack Query v5
- **Backend**: Supabase (Auth, Postgres, Storage, Realtime)
- **Validação**: Zod v3
- **Testes**: Vitest
- **Monorepo**: pnpm workspaces

---

*Documento de referência — atualizado em 2026-10-13*
