# Copilot conventions

- Use Svelte 5 runes and component events only; avoid legacy exports, directives, stores, and slots.
- Model shared state as store classes with methods; use `$state.raw` for large replace-only values and derive state rather than synchronizing it with effects.
- Prefer `{@attach}` for DOM integrations and snippets for component composition.
- Use `@/` imports, strict TypeScript, and English identifiers; user-facing text belongs in Paraglide messages.
- Keep feature-specific code under `src/features/<feature>` and reusable UI/API utilities under `src/shared`.
- Use TanStack Svelte Query for API reads and mutations; preserve atomic data replacement and route global errors through `notifyError`.
- Keep the OpenAPI contract and Spring backend unchanged in this repository. Regenerate API clients with `pnpm generate` rather than editing generated files.
- Keep code changes surgical and preserve existing UI and API behavior.
- Derive values directly from stores that emit the same mutable instance; avoid chained derived reads from that instance.
- Local reads are instant: do not add abort, debounce, or request-id guards on the selection path.
- Do not add loading UI inside the dashboard layout; route slow sync progress and errors through headless `toast.custom` components in `notify.ts`.
- Replace data atomically without clearing lists before replacements arrive, except when switching courses.
- Keep errors raised while modal dialogs are open inline within those dialogs.
- Avoid mutating global or shared state during component initialization; perform updates through store methods or lifecycle effects.
- Run `pnpm verify` and `cargo check --manifest-path src-tauri/Cargo.toml` before finishing; Copilot edits bypass the husky hooks. See `README.md` for development setup.
