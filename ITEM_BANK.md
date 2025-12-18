
# Item Bank Factory

## Overview
The Item Bank Factory is a subsystem for generating, validating, and serving a psychometrically rigorous bank of survey items (~600 items). It operates independently of the core runtime until the feature flag `ITEM_BANK_MODE` is enabled.

## Schema
Items are defined in `services/measurement/item_bank_factory/types.ts`.
Key properties:
- `construct`: One of 14 constructs.
- `type`: `rating` | `choice` | `text`.
- `time_window`: `7d` | `14d` | `30d`.
- `difficulty`: `shallow` | `medium` | 'deep'.

## Build Pipeline
To generate the item bank:
```bash
npm run itembank:build
```
This script:
1. Expands templates from `templates.ts`.
2. (Optional) Paraphrases using OpenAI if Key present.
3. Validates correctness (psychometric structure).
4. Deduplicates (Jaccard similarity).
5. Writes `services/measurement/item_bank.ts`.

## Validation
Lint item bank quality:
```bash
npm run itembank:lint
```
Checks for:
- Double-barreled questions.
- Leading/Biased language.
- Structural integrity.

## Stats
View current coverage:
```bash
npm run itembank:stats
```

## Usage
The bank is exported as `ITEM_BANK`.
To select items at runtime (when enabled):
```typescript
import { selectItems } from 'services/measurement/item_select';
const items = selectItems({ count: 10 });
```
