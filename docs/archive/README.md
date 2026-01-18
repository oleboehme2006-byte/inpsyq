# Documentation Archive

This directory contains historical development documentation that has been superseded by the canonical documentation structure.

## Purpose

These files document the development history and phase-by-phase implementation of InPsyq. They are preserved for:
- Historical reference
- Audit trail
- Understanding past design decisions

## Status

**NOT ACTIVE** — Do not use for current operations.

All relevant information has been consolidated into the canonical documentation:
- `docs/architecture/` — System design
- `docs/security/` — Auth, authorization, audit
- `docs/operations/` — Deployment, monitoring, test org
- `docs/development/` — Local setup, verification

## What's Archived

### Phase Documents (PHASE*.md)
Development milestones documenting features as they were built. Each phase represented a sprint or feature increment.

### Historical Runbooks (RUNBOOK_PHASE*.md)
Operational guides specific to individual phases. These have been consolidated into the canonical runbooks.

### Legacy Verification Docs
Testing documentation that has been superseded.

## When to Reference

Only reference archived documents if:
1. Investigating historical design decisions
2. Understanding why something was built a certain way
3. Debugging legacy behavior

## Do NOT

- Use archived runbooks for current operations
- Reference archived docs in new code
- Update archived documents

## Questions?

If you need information not in canonical docs, file an issue to update the main documentation rather than resurrecting archived content.
