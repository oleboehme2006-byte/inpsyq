# Troubleshooting

Common issues and their solutions.

## Authentication Issues

### Magic Link Not Received

**Symptoms**: User requests login, no email arrives

**Causes & Fixes**:
| Cause | Fix |
|-------|-----|
| `EMAIL_PROVIDER=disabled` | Set to `resend` in production |
| Missing `RESEND_API_KEY` | Add key to environment |
| Email in spam | Check spam folder |
| Preview deployment | Preview never sends real emails |

### Magic Link Invalid

**Symptoms**: Clicking link shows error

**Causes & Fixes**:
| Cause | Fix |
|-------|-----|
| Token expired | Request new link (10 min expiry) |
| Token already used | Request new link (single use) |
| Wrong origin | Check `AUTH_BASE_URL` matches production |

### Session Not Created

**Symptoms**: After clicking link, not logged in

**Causes & Fixes**:
| Cause | Fix |
|-------|-----|
| Cookie blocked | Check browser settings |
| Wrong domain | Verify canonical origin |
| DB error | Check server logs |

## Dashboard Issues

### "No Data Found"

**Symptoms**: Dashboard shows empty state

**Causes & Fixes**:
| Cause | Fix |
|-------|-----|
| No aggregates | Run seed or wait for weekly pipeline |
| Wrong org/team ID | Verify IDs from status endpoint |
| Wrong week selected | Select week with data |

### Empty Drivers

**Symptoms**: Driver section empty

**Causes & Fixes**:
| Cause | Fix |
|-------|-----|
| Insufficient data | Need 3+ sessions |
| All healthy | No risks to display (check strengths) |
| DecisionService error | Check server logs |

### Governance Blocked

**Symptoms**: Dashboard shows blocked state

**Causes**:
- High uncertainty (sigma > 0.4)
- Extreme anomaly (Z-score > 3.0)
- Insufficient data (sessions < 3)

**Fix**: Gather more data or review anomaly

## Build Issues

### Missing Export Error

**Symptoms**: Build fails with "Module not found"

**Causes & Fixes**:
| Cause | Fix |
|-------|-----|
| Import typo | Check import path |
| Missing export | Add export to source file |
| Circular import | Refactor dependencies |

### Edge Runtime Error

**Symptoms**: Build fails with "fs module not found"

**Cause**: Using Node.js-only modules in Edge runtime

**Fix**: 
- Use dynamic imports: `await import('fs')`
- Mark route as Node.js: `export const runtime = 'nodejs'`

## Database Issues

### Connection Refused

**Symptoms**: "ECONNREFUSED" error

**Causes & Fixes**:
| Cause | Fix |
|-------|-----|
| Wrong `DATABASE_URL` | Verify connection string |
| Database offline | Check Neon dashboard |
| SSL required | Ensure `sslmode=require` in URL |

### Unique Constraint Violation

**Symptoms**: Insert fails with duplicate key error

**Cause**: Attempting to create duplicate record

**Fix**: 
- Check for existing record first
- Use `ON CONFLICT` clause
- Verify data integrity

## Seed Issues

### Ensure Fails

**Symptoms**: `/test-org/ensure` returns error

**Causes & Fixes**:
| Cause | Fix |
|-------|-----|
| DB connection | Check DATABASE_URL |
| Schema missing | Run schema migrations |
| Wrong secret | Check INTERNAL_ADMIN_SECRET |

### Low Session Count

**Symptoms**: Status shows fewer sessions than expected

**Causes & Fixes**:
| Cause | Fix |
|-------|-----|
| Seed not run | Run seed endpoint |
| Fewer weeks | Increase weeks parameter |
| Pre-delete failed | Check for constraint issues |

## Performance Issues

### Slow Dashboard Load

**Symptoms**: Dashboard takes > 2 seconds

**Causes & Fixes**:
| Cause | Fix |
|-------|-----|
| Cache miss | First load is slower, retry |
| Large dataset | Check data volume |
| DB latency | Check Neon dashboard |

### Memory Issues

**Symptoms**: Out of memory errors

**Causes & Fixes**:
| Cause | Fix |
|-------|-----|
| Large aggregation | Limit week range |
| Cache bloat | Restart server |
| Memory leak | Check for unclosed connections |

## Debugging Tools

### Origin Diagnostics

```bash
curl https://www.inpsyq.com/api/internal/diag/auth-origin \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET"
```

### System Health

```bash
curl https://www.inpsyq.com/api/internal/health/system \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET"
```

### Test Org Status

```bash
curl https://www.inpsyq.com/api/internal/admin/test-org/status \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET"
```
