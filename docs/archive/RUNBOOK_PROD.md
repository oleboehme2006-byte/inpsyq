APP_URL=https://www.inpsyq.com

# 1) Init
curl -i "$APP_URL/api/init"

# 2) Seed (copy orgId/teamAId/teamBId)
curl -s "$APP_URL/api/seed"

# 3) Weekly
curl -s "$APP_URL/api/admin/weekly?org_id=<ORG_ID>&team_id=<TEAM_ID>" | head -c 800; echo

# 4) Profiles
curl -s "$APP_URL/api/admin/profiles?org_id=<ORG_ID>&team_id=<TEAM_ID>" | head -c 800; echo

# 5) Audit (extract week_start then call audit)
WEEK_START=$(curl -s "$APP_URL/api/admin/weekly?org_id=<ORG_ID>&team_id=<TEAM_ID>" \
 | grep -o '"week_start":"[^"]*"' | head -n 1 | cut -d'"' -f4)
echo "$WEEK_START"
curl -s "$APP_URL/api/admin/audit/team-contributions?org_id=<ORG_ID>&team_id=<TEAM_ID>&week_start=$WEEK_START" | head -c 1200; echo
