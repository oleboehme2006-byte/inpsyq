# Data Model

## Core Entities

### Organizations (`orgs`)
```sql
org_id     UUID PRIMARY KEY
name       TEXT NOT NULL
created_at TIMESTAMPTZ DEFAULT now()
```

### Users (`users`)
```sql
user_id    UUID PRIMARY KEY DEFAULT gen_random_uuid()
email      TEXT UNIQUE NOT NULL
name       TEXT
deleted_at TIMESTAMPTZ  -- Soft delete for GDPR
created_at TIMESTAMPTZ DEFAULT now()
```

### Teams (`teams`)
```sql
team_id    UUID PRIMARY KEY DEFAULT gen_random_uuid()
org_id     UUID REFERENCES orgs(org_id)
name       TEXT NOT NULL
created_at TIMESTAMPTZ DEFAULT now()
```

### Memberships (`memberships`)
```sql
membership_id UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id       UUID REFERENCES users(user_id)
org_id        UUID REFERENCES orgs(org_id)
team_id       UUID REFERENCES teams(team_id)
role          TEXT CHECK (role IN ('ADMIN', 'EXECUTIVE', 'TEAMLEAD', 'EMPLOYEE'))
created_at    TIMESTAMPTZ DEFAULT now()

UNIQUE(user_id, org_id)
```

## Authentication

### Sessions (`sessions`)
```sql
session_id   UUID PRIMARY KEY
user_id      UUID REFERENCES users(user_id)
token_hash   TEXT NOT NULL
expires_at   TIMESTAMPTZ NOT NULL
last_seen_at TIMESTAMPTZ
ip           TEXT
user_agent   TEXT
created_at   TIMESTAMPTZ DEFAULT now()
```

### Login Tokens (`login_tokens`)
```sql
id           SERIAL PRIMARY KEY
email        TEXT NOT NULL
token_hash   TEXT NOT NULL
expires_at   TIMESTAMPTZ NOT NULL
consumed_at  TIMESTAMPTZ
created_at   TIMESTAMPTZ DEFAULT now()

INDEX ON email
```

### Invites (`active_invites`)
```sql
invite_id    UUID PRIMARY KEY
org_id       UUID REFERENCES orgs(org_id)
email        TEXT
role         TEXT
created_by   UUID REFERENCES users(user_id)
max_uses     INTEGER DEFAULT 1
uses_count   INTEGER DEFAULT 0
expires_at   TIMESTAMPTZ
created_at   TIMESTAMPTZ DEFAULT now()
```

## Measurement

### Measurement Sessions (`measurement_sessions`)
```sql
session_id   UUID PRIMARY KEY
user_id      UUID REFERENCES users(user_id)
org_id       UUID REFERENCES orgs(org_id)
team_id      UUID REFERENCES teams(team_id)
week_start   DATE NOT NULL
status       TEXT CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'ABANDONED'))
started_at   TIMESTAMPTZ
completed_at TIMESTAMPTZ
created_at   TIMESTAMPTZ DEFAULT now()

UNIQUE(user_id, week_start)  -- Global: one session per user per week
```

### Measurement Responses (`measurement_responses`)
```sql
response_id   UUID PRIMARY KEY DEFAULT gen_random_uuid()
session_id    UUID REFERENCES measurement_sessions(session_id)
user_id       UUID REFERENCES users(user_id)
item_id       TEXT NOT NULL
numeric_value NUMERIC
text_value    TEXT
created_at    TIMESTAMPTZ DEFAULT now()
```

### Measurement Quality (`measurement_quality`)
```sql
session_id       UUID PRIMARY KEY REFERENCES measurement_sessions(session_id)
completion_rate  NUMERIC
response_time_ms INTEGER
missing_items    INTEGER
confidence_proxy NUMERIC
```

## Interpretation

### Weekly Interpretations (`weekly_interpretations`)
```sql
id             SERIAL PRIMARY KEY
org_id         UUID REFERENCES orgs(org_id)
team_id        UUID REFERENCES teams(team_id)  -- NULL for org-level
week_start     DATE NOT NULL
input_hash     TEXT NOT NULL
model_id       TEXT NOT NULL
prompt_version TEXT NOT NULL
sections_json  JSONB NOT NULL
is_active      BOOLEAN DEFAULT true
created_at     TIMESTAMPTZ DEFAULT now()

INDEX ON (org_id, team_id, week_start, is_active)
```

## Audit

### Security Audit Log (`security_audit_log`)
```sql
id            SERIAL PRIMARY KEY
actor_user_id UUID
org_id        UUID
action        TEXT NOT NULL
metadata      JSONB
created_at    TIMESTAMPTZ DEFAULT now()

INDEX ON action
INDEX ON actor_user_id
INDEX ON created_at
```

## Key Constraints

| Constraint | Purpose |
|------------|---------|
| `measurement_sessions(user_id, week_start)` UNIQUE | One session per user per week globally |
| `memberships(user_id, org_id)` UNIQUE | One membership per user per org |
| `users(email)` UNIQUE | Email is identity |

## Reserved IDs

| ID | Purpose |
|----|---------|
| `99999999-9999-4999-8999-999999999999` | Test Organization |
| `11111111-1111-4111-8111-111111111111` | Dev Fixture Org 1 |
| `22222222-2222-4222-8222-222222222222` | Dev Fixture Org 2 |
