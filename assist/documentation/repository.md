# CODEXSUN Core Repository Contract

## Nature

Tenant-owned common business foundation with independently owned API and web workspaces.

## Ownership

Common lookups, location hierarchy, accounts masters, organisation data, contacts, products, work orders, Core permissions, API contracts, and Core UI.

Excluded ownership: Platform tenant/auth operations, Billing documents, Mail internals, and generic UI primitives.

## Current Structure

- `api/src/modules/common/`
- `api/src/modules/organisation/`
- `api/src/modules/master/`
- `api/src/database/core-database.ts`
- `web/src/modules/`

## Migration Contract

Tenant database only. Order: legacy-name normalization → Common lookups → Organisation → Master. Location is Country → State → District → City → Pincode; Organisation is Company → Financial Year → Default Company; Master is Contact → Product → Work Order.

Every Core-owned physical table uses the `core_` prefix and Core records lifecycle evidence in
`core_schema_migrations`. Migration `004_prefix_core_table_names` forward-renames existing
unprefixed tables without copying or dropping data. Updatable unprefixed compatibility views
preserve existing public repository contracts during the transition; new foreign keys must target
the physical `core_*` tables.

## Seed Contract

The seed order mirrors migrations: Common (including the complete location hierarchy) → Organisation → Master → Core permissions. Parent records are resolved from persisted identities, never sibling seed arrays. Organisation seeding preserves existing records, backfills the seven financial years from three years before through three years after the current financial year, and initializes Default Company with `application` as its editable landing app. Core permissions are assigned to the composing application's protected `super-admin`, `admin`, and assignable `administrator` roles when those persisted roles exist.

## Environment Contract

No repository-local `.env` is required. Runtime values are loaded from the composing `codexsun/.env`: Platform URL, tenant/master database connection, and JWT secret.

## Composition Contract

This repository exposes intentional public package contracts. Executable composition roots may
install, register, order, build, and invoke exported lifecycle functions; they must not copy this
repository's business implementation. The existing `registerCoreApi()` contract supports the
CODEXSUN Platform host. `registerCoreApiForHost()` supports trusted reusable runtimes by accepting
the host-resolved tenant database, principal and permission grants. `coreWebBundle` is the matching
Core-owned workspace and navigation contribution. `useCoreApplicationContext()` is the public web
composition hook for the active company logo/name, financial year, and persisted default switcher;
hosts render that context but do not reimplement Core organisation rules.

## Required Checks

- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test:stack` creates an isolated MariaDB database and verifies fresh plus repeated
  migrations, seeds, every Core contract consumed by Billing, `core_*` physical tables,
  compatibility views, and representative owner CRUD/lifecycle behavior.
- `npm run check:versions`
- `npm run github:now -- --dry-run`

Run composed boundary, database, and E2E checks from the sibling `codexsun` repository when the change affects runtime integration.
