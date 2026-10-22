-- PostgreSQL schema behind the Store interface (server/src/store.ts).
-- Applied at startup; every statement must be safe to run again.

create table if not exists accounts (
  id          text primary key,
  token_hash  text not null unique,        -- sha256 of the bearer token; the token itself is never stored
  created_at  timestamptz not null default now()
);

-- Last day the account was used; accounts unused for 24 months are deleted (privacy policy §7).
alter table accounts add column if not exists last_seen_at timestamptz not null default now();

create table if not exists progress (
  account_id  text primary key references accounts(id) on delete cascade,
  data        jsonb not null,               -- @linguasea/core Progress
  updated_at  timestamptz not null default now()
);

create table if not exists entitlements (
  account_id    text primary key references accounts(id) on delete cascade,
  premium_until timestamptz not null,
  event_at      timestamptz not null,       -- time of the store event that set it (out-of-order guard)
  updated_at    timestamptz not null default now()
);

create table if not exists usage (
  account_id  text not null references accounts(id) on delete cascade,
  day         date not null,
  key         text not null,                -- e.g. "pronunciation"
  count       integer not null,
  primary key (account_id, day, key)
);
