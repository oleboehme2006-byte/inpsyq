# Traceability: Artifact Consolidation

This document traces where historical artifact knowledge now resides.

## Deleted Artifacts

### Phase Documentation (58 files)
**Location removed**: `docs/archive/PHASE*.md`

**Knowledge preserved in**:
- `docs/architecture/SYSTEM_OVERVIEW.md` - System design
- `docs/architecture/PSYCHOMETRIC_MODEL.md` - Indices, drivers, items
- `docs/architecture/MEASUREMENT_LAYER.md` - Sessions, responses
- `docs/architecture/SCORING_AND_AGGREGATION.md` - Scoring rules
- `docs/architecture/ATTRIBUTION_ENGINE.md` - Causal analysis
- `docs/architecture/INTERPRETATION_LAYER.md` - LLM integration
- `docs/security/AUTHENTICATION.md` - Auth flow
- `docs/operations/DEPLOYMENT.md` - Deploy procedures

### Phase Runbooks (17 files)
**Location removed**: `docs/archive/RUNBOOK_PHASE*.md`

**Knowledge preserved in**:
- `docs/operations/RUNBOOK_DEPLOYMENT.md`
- `docs/operations/RUNBOOK_ADMIN.md`
- `docs/operations/RUNBOOK_VERIFICATION.md`

### Phase Scripts (91 files)
**Location removed**: `scripts/archive/verify_phase*.ts`

**Knowledge preserved**: Script invariants now documented in `docs/development/VERIFICATION.md`. Core verification remains in `scripts/verification/`.

### Redundant Active Scripts (19 files)
**Removed**: Historical debugging scripts superseded by canonical verification.

**Remaining verification scripts** (13 total):
- `scripts/verification/origin.verify.ts`
- `scripts/verification/email.verify.ts`
- `scripts/verification/test-org.verify.ts`
- `scripts/verify_access.ts`
- `scripts/verify_dashboard.ts`
- `scripts/verify_pipeline_coverage.ts`
- ... (+ 7 others)

## Conceptual Mapping

| Former Phase | Current Location |
|--------------|------------------|
| Phase 7-9 | SYSTEM_OVERVIEW.md, INTERPRETATION_LAYER.md |
| Phase 11-15 | SCORING_AND_AGGREGATION.md |
| Phase 21-22 | DEPLOYMENT.md, RUNBOOK_DEPLOYMENT.md |
| Phase 23 | AUTHENTICATION.md |
| Phase 24-26 | AUTHORIZATION.md, TEST_ORG.md |
| Phase 31 | AUTHENTICATION.md (rate limits), AUDIT_LOGGING.md |
| Phase 34 | ATTRIBUTION_ENGINE.md |
| Phase 36 | DEPLOYMENT.md (origin), RUNBOOK_ADMIN.md |

## Verification

All knowledge was verified present before deletion by cross-referencing canonical docs against archived content.
