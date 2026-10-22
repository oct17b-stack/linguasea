-- PostgreSQL schema behind the Store interface (server/src/store.ts).
create table accounts (
  id          text primary key,
  token_hash  text not null unique,        -- sha256 of the bearer token; the token itself is never stored
  created_at  timestamptz not null default now()
);

create table progress (
  account_id  text primary key references accounts(id) on delete cascade,
  data        jsonb not null,               -- @linguasea/core Progress
  updated_at  timestamptz not null default now()
);

create table entitlements (
  account_id    text primary key references accounts(id) on delete cascade,
  premium_until timestamptz not null,
  updated_at    timestamptz not null default now()
);
