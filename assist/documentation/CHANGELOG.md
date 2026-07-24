# CODEXSUN Core Changelog

## Version State

Current version: 1.0.46
Release tag: v-1.0.46
Changelog label: v 1.0.46

## v-1.0.46

### [v 1.0.46] 2026-07-24 10:39 am - Synchronize default landing and preserve address spacing

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Added the public Default Company application contract so executable compositions can get, save,
  and synchronize the landing app through Core-owned service and database boundaries.
- Allowed the composed workspace to inject the coordinated Default Company save operation and
  receive the saved record without duplicating Core form behavior.
- Preserved typed spaces while editing Company and Contact address lines, then normalized leading
  and trailing whitespace only at submission.
- Exported the intentional Default Company contract from the Core API package for Platform use.
- Bumped repository version to 1.0.46.

## v-1.0.45

### [v 1.0.45] 2026-07-23 11:11 am - Align Framework 1.0.44 dependency

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Refreshed the repository lockfile so Core resolves the verified `@codexsun/framework` `1.0.44`
  package and its current public contracts.
- Verified Core API and Web TypeScript compilation and production builds while preserving
  module-owned migrations, seeds, relationships, and lifecycle behavior.
- Bumped repository version to 1.0.45.

## v-1.0.44

### [v 1.0.44] 2026-07-22 11:19 pm - Restore shared bottom-right notifications

#### Database Changes

- Database update: No.

#### App Codebase Changes

- Routed Core workspace notifications through the UI-owned Sonner export, removing the duplicate
  package instance that prevented the mounted toaster from receiving events.
- Preserved module-owned success, warning, information, and error messages while restoring their
  bottom-right presentation in the composed application.
- Bumped repository version to 1.0.44.

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
