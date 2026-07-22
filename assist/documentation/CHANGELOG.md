# CODEXSUN Core Changelog

## Version State

Current version: 1.0.43
Release tag: v-1.0.43
Changelog label: v 1.0.43

## v-1.0.43

### [v 1.0.43] 2026-07-22 8:52 pm - Finalize Core lifecycle and company legal name workflow

#### Database Changes

- Database update: No.
- Extended the tenant connection idle lifetime without changing tables, migrations, seeds, or stored data.

#### App Codebase Changes

- Allowed spaces in company legal names and added a magic action that derives an uppercase legal name from the company name.
- Added repository-local Assist rules, release tooling, and documentation, and bumped the repository to 1.0.43.

## v-1.0.42

### [v 1.0.42] 2026-07-22 - Establish Core repository documentation

#### Database Changes

- Database update: No.
- Documented the repository-owned migration and seed lifecycle without moving persistence behavior across repositories.

#### App Codebase Changes

- Added repository-local Assist discovery, ownership, structure, environment, version, and Git workflow guidance.
- Added standalone version validation, version bump, and `github:now` tooling.
