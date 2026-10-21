# Handoff — Phase 1 (Application foundation)

- Date: 2026-10-21 | Base commit: `9f58784` | Changes: UNCOMMITTED in sandbox (not pushed; owner pushes).
- Status: IMPLEMENTED; VERIFICATION_REQUIRED for DB connectivity. Details: `CURRENT_STATE.md`.

## Owner checklist (on a networked machine)
1. `npm install` (runs `prisma generate` via postinstall; needs access to `binaries.prisma.sh`).
2. `npm run db:validate`, `npm run typecheck`, `npm run lint`, `npm run build`.
3. Copy `.env.example` to `.env`; fill real Supabase `DATABASE_URL` (pooler) and `DIRECT_URL` (direct/session). Never commit `.env`.
4. `npx shadcn@latest add button input ...` when Phase 2 starts; check it coexists with the manual `components.json`.
5. Decide: rename `ai/` to `.ai/`? Approve ADR-012 (Supabase Auth)?

## Caveats for the next agent
- `prisma validate/generate` only passed in the sandbox with `PRISMA_SCHEMA_ENGINE_BINARY=/bin/true` (network limitation). Do not copy that into the repo.
- `src/generated/` is gitignored; `tsc`/build need `prisma generate` first (postinstall handles it).
- `npm audit` shows 5 dev-only highs via eslint-config-next; do not run `npm audit fix --force` (downgrades Next).
- Env validation was verified by an ad-hoc script only; there is no test runner yet (planned for later phases).
