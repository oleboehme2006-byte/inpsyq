# DEV NOTE: Structural Model Upgrade (Phase 7 Fixes)

## 1. What was broken?
- **TypeScript Import Extensions**: `verify_model_integrity_full.ts` imported `flags.ts` with the extension. This violates standard TS resolution ensuring build failures.
- **Missing Scripts**: `package.json` lacked `verify:measurement_layer` and `verify:full`, causing developer confusion (instructions mismatched reality).
- **Incomplete Verification**: The "Full" integrity check was outdated, missing 4 of the 8 new layers (Counterfactuals, Roles, Risk, Diagnostics).

## 2. Why it failed?
- **File Extensions**: In `tsconfig.json` standard setups (or Next.js defaults), importing `.ts` explicitly is forbidden unless specific flags (`allowImportingTsExtensions`) are set, which usually requires `noEmit`, conflicting with standard builds.
- **Process Gaps**: New scripts were created but not registered in `package.json`.
- **Drift**: The Master Doc (`MODEL_ARCHITECTURE.md`) evolved faster than the verification script.

## 3. How we fixed it?
- **Audited Imports**: Scanned `scripts/` for `.ts` regex. Fixed `verify_model_integrity_full.ts`.
- **Updated Package.json**: Added missing aliases.
- **Hardened Verification**: Rewrote `verify_model_integrity_full.ts` to explicitly import and test ALL 8 layers. It now serves as the canonical "Health Check".

## 4. Future Prevention
- **Rule**: Never import with `.ts` extension.
- **Rule**: When adding a `verify_*.ts` script, immediately add it to `package.json`.
- **Rule**: Keep `verify_model_integrity_full.ts` in sync with `MODEL_ARCHITECTURE.md`. If a layer is added to the architecture, add it to the validaton script immediately.
