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

## Seed Contract

The seed order mirrors migrations: Common (including the complete location hierarchy) → Organisation → Master → Core permissions. Parent records are resolved from persisted identities, never sibling seed arrays.

## Environment Contract

No repository-local `.env` is required. Runtime values are loaded from the composing `codexsun/.env`: Platform URL, tenant/master database connection, and JWT secret.

## Composition Contract

This repository exposes intentional public package contracts. The `codexsun` repository is the executable composition root. It may install, register, order, build, and invoke exported lifecycle functions; it must not copy this repository's business implementation.

## Required Checks

- `npm run format:check`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run check:versions`
- `npm run github:now -- --dry-run`

Run composed boundary, database, and E2E checks from the sibling `codexsun` repository when the change affects runtime integration.
