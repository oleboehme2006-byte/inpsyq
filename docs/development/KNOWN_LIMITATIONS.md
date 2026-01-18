# Known Limitations & Future Work

## Overview

This document captures known limitations, technical debt, and planned improvements. It serves as a roadmap for future development.

---

## Psychometric Model

### Current Limitations

| Limitation | Impact | Priority |
|------------|--------|----------|
| **4 indices only** | Cannot capture all organizational dynamics | Medium |
| **6 drivers only** | Some mechanisms not modeled | Medium |
| **11 items** | Limited measurement depth per construct | High |
| **No adaptive testing** | Fixed item set regardless of context | Medium |

### Planned Improvements

- [ ] Add **resilience** index (recovery capacity)
- [ ] Add **development** index (growth opportunity perception)
- [ ] Expand item bank to 25+ items with adaptive selection
- [ ] Implement IRT-based adaptive testing

---

## Measurement

### Current Limitations

| Limitation | Impact | Priority |
|------------|--------|----------|
| **Weekly cadence only** | Cannot detect rapid changes | Low |
| **No longitudinal tracking** | Individual trends not computed | Medium |
| **No response anchoring** | Scale interpretation varies by person | High |
| **Self-report bias** | Social desirability effects | Low (inherent) |

### Planned Improvements

- [ ] Implement response style detection (acquiescence, extremity)
- [ ] Add ipsative scoring option for person-centered analysis
- [ ] Build individual-level longitudinal models

---

## Scoring & Aggregation

### Current Limitations

| Limitation | Impact | Priority |
|------------|--------|----------|
| **Simple mean aggregation** | Outliers not handled | Medium |
| **Minimum N=3** | Small teams have noisy data | High |
| **No hierarchical modeling** | Team/org effects conflated | Low |
| **Linear trend only** | Non-linear patterns missed | Low |

### Planned Improvements

- [ ] Implement robust aggregation (trimmed mean or median)
- [ ] Add Bayesian shrinkage for small N teams
- [ ] Build multilevel models (individual → team → org)
- [ ] Detect regime changes with changepoint analysis

---

## Attribution

### Current Limitations

| Limitation | Impact | Priority |
|------------|--------|----------|
| **Rule-based only** | No learned causal relationships | Medium |
| **No counterfactuals** | Cannot answer "what if" | High |
| **External dependencies manual** | Requires admin input | Medium |
| **No intervention tracking** | Cannot measure action efficacy | Critical |

### Planned Improvements

- [ ] Implement causal inference (difference-in-differences)
- [ ] Build intervention efficacy tracking
- [ ] Automate external dependency detection from context
- [ ] Add counterfactual scenario modeling

---

## Interpretation

### Current Limitations

| Limitation | Impact | Priority |
|------------|--------|----------|
| **LLM dependency** | Cost and latency | Medium |
| **Template fallback is basic** | Lower quality when LLM unavailable | Low |
| **English only** | No internationalization | High for expansion |
| **No user feedback loop** | Cannot learn from corrections | Medium |

### Planned Improvements

- [ ] Fine-tune smaller model for interpretations
- [ ] Add multi-language support (DE, FR, ES)
- [ ] Implement feedback collection and retraining
- [ ] Build explanation feature (why this recommendation?)

---

## Privacy & Compliance

### Current Limitations

| Limitation | Impact | Priority |
|------------|--------|----------|
| **No differential privacy** | Re-identification theoretically possible | Medium |
| **Retention manual** | Requires scheduled cleanup | Low |
| **No consent versioning** | Policy changes not tracked | Medium |

### Planned Improvements

- [ ] Implement k-anonymity checks before aggregation
- [ ] Automate retention with configurable policies
- [ ] Build consent audit trail

---

## Performance & Scale

### Current Limitations

| Limitation | Impact | Priority |
|------------|--------|----------|
| **In-memory rate limiting** | Resets on deploy | Low |
| **No horizontal scaling** | Single-instance bottleneck | Low (current scale) |
| **Synchronous LLM calls** | Interpretation latency | Medium |

### Planned Improvements

- [ ] Move rate limiting to Redis
- [ ] Implement background interpretation generation
- [ ] Add read replicas for dashboard queries

---

## Technical Debt

### Code Quality

| Item | Location | Effort |
|------|----------|--------|
| Some phase-named scripts remain | `scripts/` | Low |
| Inconsistent error types | Various | Medium |
| Missing unit tests | `lib/attribution/` | High |

### Documentation

| Item | Status |
|------|--------|
| API documentation (OpenAPI) | Not started |
| Onboarding guide | Partial |
| Architecture diagrams | Text only |

---

## Roadmap Priority

### Q1 2024
1. Intervention tracking (critical for ROI proof)
2. Expand item bank
3. Multi-language support

### Q2 2024
1. Bayesian small-N handling
2. Background interpretation generation
3. Counterfactual modeling

### Q3 2024
1. Adaptive testing
2. Multilevel modeling
3. Fine-tuned interpretation model

---

## Contributing

When addressing limitations:
1. Update this document when work begins
2. Mark completed items with [x]
3. Add new limitations as discovered
4. Prioritize based on user impact
