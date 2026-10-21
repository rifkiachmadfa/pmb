# AI Project Documentation

This directory is the persistent project memory for Claude and other coding agents.

## Read order at the start of every task
1. `CURRENT_STATE.md`
2. `PROJECT_CONTEXT.md`
3. `ROADMAP.md`
4. `PHASES.md`
5. `BUSINESS_RULES.md`
6. `DECISIONS.md`
7. Relevant documents: `ARCHITECTURE.md`, `DATA_MODEL.md`, `SECURITY.md`, `INTEGRATIONS.md`, `TESTING.md`
8. Latest file in `handoff/`, if it exists.

## Maintenance rules
- Record verified repository facts, not assumptions.
- Distinguish APPROVED, PROPOSED, UNKNOWN, IMPLEMENTED, TESTED, and BLOCKED.
- Update current state, roadmap, changelog, and handoff after each completed task.
- Do not claim a feature is implemented or tested without code/test evidence.
- Keep sensitive personal data, credentials, tokens, and production secrets out of these documents.
- When a document conflicts with code or owner instruction, investigate and document the discrepancy.
