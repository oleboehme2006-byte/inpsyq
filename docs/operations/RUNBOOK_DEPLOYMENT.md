# Deployment Runbook

## Pre-Deployment Checklist

- [ ] All local tests pass
- [ ] `npm run build` succeeds
- [ ] `npm run lint` shows no errors
- [ ] Verification scripts pass
- [ ] No uncommitted changes

## Standard Deployment

### Step 1: Prepare
```bash
git checkout main
git pull origin main
git status  # Should be clean
```

### Step 2: Local Verification
```bash
npm run build
npm run lint
npx tsx scripts/verification/origin.verify.ts
```

### Step 3: Deploy to Production
```bash
git checkout production
git merge main
git push origin production
```

### Step 4: Monitor Deployment
1. Watch Vercel deployment progress
2. Check deployment logs for errors
3. Wait for deployment to complete (typically 2-3 minutes)

### Step 5: Post-Deployment Verification

**Health Check**:
```bash
curl https://www.inpsyq.com/api/internal/health/system \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" | jq
```

**Origin Check**:
```bash
curl https://www.inpsyq.com/api/internal/diag/auth-origin \
  -H "Authorization: Bearer $INTERNAL_ADMIN_SECRET" | jq
```

## Rollback Procedure

### Via Git
```bash
git checkout production
git revert HEAD
git push origin production
```

### Via Vercel
1. Go to Vercel Dashboard → Project → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"

## Emergency Procedures

### Production Down
1. Check Vercel status page
2. Check Neon database status
3. Roll back to last known good
4. Notify stakeholders

### Database Migration Failed
1. Do NOT retry automatically
2. Check database logs
3. Fix migration script
4. Roll back if needed

## Environment Variable Updates

### Add New Variable
1. Add to Vercel: Project → Settings → Environment Variables
2. Select environments (Production/Preview/Development)
3. Redeploy for changes to take effect

### Update Existing Variable
1. Edit in Vercel
2. Redeploy

### Rotate Secrets
1. Generate new value
2. Update in Vercel
3. Redeploy
4. Revoke old value (if applicable)
5. Document in audit log

## Branch Strategy

```
feature/* → main (PR) → production (merge)
```

- `main`: Integration branch, preview deploys
- `production`: Live production branch
- `feature/*`: Development branches

## Maintenance Windows

### Scheduled
1. Announce 24 hours in advance
2. Schedule for low-traffic period
3. Have rollback ready

### Unscheduled
1. Assess urgency
2. Communicate status
3. Execute fix
4. Post-mortem
