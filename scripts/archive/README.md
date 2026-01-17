# Scripts Archive

This directory contains historical phase-based verification scripts that were used during development.

These scripts are **archived for reference only**. Use the consolidated verification scripts in `scripts/verify/` instead.

## Active Verification Scripts

```bash
scripts/verify/
├── auth.verify.ts           # Authentication invariants
├── email.verify.ts          # Magic link generation
├── test-org.verify.ts       # Test org seeding
├── production-smoke.verify.ts  # Production health
└── _common.ts              # Shared utilities
```

## Can I Delete These?

Yes, these files can be safely deleted after verifying the consolidated scripts work correctly.
