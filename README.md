# UbuMonitor Analytics

Desktop analytics client for UBUMonitor. The frontend is a Tauri 2, Svelte 5, and
TypeScript application; the Spring API and its OpenAPI contract are maintained
in the separate `ubumonitor-analytics-api` repository.

## Development

Requirements: Node.js, pnpm, the Rust toolchain, and the platform prerequisites
for [Tauri](https://tauri.app/start/prerequisites/).

On Windows, download the Java runtime and backend JAR into the Tauri resources
directory:

```powershell
pnpm install
.\scripts\setup-dev-resources.ps1
pnpm tauri dev
```

The setup script downloads the JRE and JAR expected by the app. For other
platforms, place a compatible runtime at
`src-tauri/resources/jre/bin/java` (use `java.exe` on Windows) and the backend
JAR at `src-tauri/resources/app.jar`. These resources are bundled by Tauri; the
Rust application launches and monitors the Java process.

## Project commands

- `pnpm verify` — type-check, lint, formatting check, and production build.
- `cargo check --manifest-path src-tauri/Cargo.toml` — check the Tauri backend.
- `pnpm generate` — regenerate the typed frontend client from
  `open-api/api-docs.yaml`.

The frontend is organized under `src/features` and `src/shared`. Local API reads
use TanStack Svelte Query; course synchronization uses mutations. App settings
are persisted with the Tauri Store plugin.
