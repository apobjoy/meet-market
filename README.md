# Piano Bar Geelong Matches (MVP)

Next.js + Supabase app for QR-badge self-registration, up to 5 picks, mutual matching, and results via Email (Resend) + SMS (Twilio).

## Supabase schema
Run this in Supabase SQL editor:

```sql
create extension if not exists pgcrypto;

create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  submissions_close_at timestamptz not null,
  results_sent_at timestamptz,
  is_live boolean not null default true,
  created_at timestamptz not null default now()
);

create table badges (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  badge_number int not null,
  join_code text not null,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(event_id, badge_number),
  unique(event_id, join_code)
);

create table participants (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  badge_id uuid not null references badges(id) on delete restrict,
  badge_number int not null,
  first_name text not null,
  email text not null,
  mobile text not null,
  traffic_light text not null check (traffic_light in ('green','yellow','red')),
  consent boolean not null,
  created_at timestamptz not null default now(),
  unique(event_id, badge_id),
  unique(event_id, email)
);

create table picks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  picker_participant_id uuid not null references participants(id) on delete cascade,
  picked_badge_number int not null,
  created_at timestamptz not null default now()
);

create index picks_event_picker_idx on picks(event_id, picker_participant_id);
create index participants_event_badgenum_idx on participants(event_id, badge_number);
```

## Admin flow
- /admin -> login (ADMIN_PASSWORD)
- Create event (ISO date-time with timezone)
- Seed badges (1–200)
- Print badge sheet (/admin/badges?eventId=...)
- After submissions close: Send results (email + optional SMS)

## Deploy to Vercel
Push to GitHub, import into Vercel, add env vars, connect a subdomain like matches.pianobargeelong.com.au


## New in v2
- Picks page loads current saved picks, and confirms before saving.
- Live admin dashboard: /admin/dashboard (shows registered + submitted).
- Close submissions now button (updates submissions_close_at to current time).
