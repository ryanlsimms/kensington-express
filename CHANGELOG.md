# Changelog

## [Unreleased]

- Added `@types/express` as a `peerDependency` so TypeScript types resolve correctly. npm 7+ installs it automatically; older npm requires a manual `npm install @types/express`.

## [1.0.2] - 2026-05-19

- **Breaking:** `kensingtonView` now takes a single options object — `kensingtonView({ defaultLayout, htmlValidator, buildLocals })` — instead of positional arguments.
- Added `buildLocals(req, res, options)` option for full control over the locals passed to renderers.

## [1.0.1] - 2026-05-18
- npm provenance.

## [1.0.0] - 2026-05-19

- Initial release
