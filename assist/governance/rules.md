# CODEXSUN Core Governance Rules

## Repository Boundary

- This repository is independently versioned and released.
- Public package exports are the only source-level boundary available to sibling repositories.
- Private sibling paths, repositories, services, migrations, seeds, forms, hooks, and internal types must not be imported.
- Shared infrastructure must not absorb business fields, tables, validation, routes, lifecycle policy, or UI workflows.

## Module Ownership

- One business entity belongs to one backend leaf and, when it has UI, one frontend leaf.
- The leaf owns its migration, repository, service, routes, seed, types, form, list, workspace, schemas, hooks, tests, and lifecycle policy.
- Composition files may order public migration and seed functions but may not contain entity SQL or seed records.
- Parent relationships use fixed public lookups; backend services verify persisted parent IDs.
- Migrations run parents before children. Seeds follow the same order and must be safe to rerun.
- Protected records and delete blockers are enforced on the backend, not only in the UI.

## Environment

- Secrets are never committed.
- Libraries do not create competing `.env` files.
- Executable composition owns environment values and validates them at startup.
- Frontend variables must never contain server credentials.

## Version And Git

- `assist/documentation/CHANGELOG.md` is the only repository release history.
- `npm run version:bump -- --dry-run --title "<title>" --no-database-update` previews a bump.
- `npm run version:bump -- --title "<title>" --database-update` or `--no-database-update` updates this repository and its workspaces.
- `npm run check:versions` verifies package, lockfile, and changelog alignment.
- `npm run github:now` performs pull/rebase, stages changes, commits, and pushes only after review.
- Commit subjects use `#<two-or-more digits> - <message>`, for example `#42 - Document Billing ownership`.
