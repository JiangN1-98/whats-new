# Repository guidance

Read docs/technical-design.md and docs/bootstrap-status.md before implementing a milestone. Deliver the next minimal vertical slice; do not claim a scaffold is V1.

- Use pnpm 10.34.6 and Node 24.21.0, pinned in packageManager/.nvmrc.
- Keep Web UI/BFF, Nest domain/API, independent Worker boundaries. Web source cannot import server packages; shared stays browser-safe.
- No source, no answer. Never treat synthetic fixtures or dependency versions as official product facts.
- API only produces business queues; Worker consumes. M0 only has a fixture queue.
- Keep env secrets server-side, preserve revision/evidence snapshots, default unknown channels to unknown.
- Use strict TypeScript, runtime input schemas and explicit package exports. Add domain schema and migrations in M1, not placeholder success endpoints.
- Run checks appropriate to changes. Baseline commands: pnpm lint, pnpm typecheck, pnpm test, pnpm build. Integration requires a dedicated *_test DB; never reset a developer DB.
- Commit lockfile changes with exact dependency versions. Update docs to reflect actual behavior and verification limits.
