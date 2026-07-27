# CODEXSUN Core

Common tenant-owned business foundations for CODEXSUN applications.

This repository owns its backend modules, frontend modules, migrations, workers, permissions,
navigation contributions, and tests. It integrates with executable hosts through public
composition contracts. `registerCoreApi()` preserves the CODEXSUN Platform contract;
`registerCoreApiForHost()` accepts a trusted host scope, database and principal for reusable
runtimes such as CXApp. `coreWebBundle` contributes every Core workspace without moving business
UI into the host, and `useCoreApplicationContext()` exposes the active company, branding,
financial year, and default-selection actions needed by a composing application shell.

Read `assist/AGENT-GUIDE.md` before changing Core. Repository ownership, migration/seed
order, environment behavior, versioning, and Git workflow are documented under `assist/`.
