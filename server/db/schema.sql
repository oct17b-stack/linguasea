-- PostgreSQL schema behind the Store interface (server/src/store.ts).
-- Applied at startup; every statement must be safe to run again.

create table if not exists accounts (
  id          text primary key,
  created_at  timestamptz not null default now()
);

-- Last day the account was used; accounts unused for 24 months are deleted (privacy policy §7).
alter table accounts add column if not exists last_seen_at timestamptz not null default now();

-- Set when the learner signs in by email (trimmed, lower-case); null for anonymous accounts.
alter table accounts add column if not exists email text;
create unique index if not exists accounts_email_key on accounts (email);

-- Device tokens: one per install / sign-in, so an account can be used on several devices.
create table if not exists tokens (
  token_hash  text primary key,             -- sha256 of the bearer token; the token itself is never stored
  account_id  text not null references accounts(id) on delete cascade,
  created_at  timestamptz not null default now()
);
create index if not exists tokens_account_id on tokens (account_id);

-- Accounts used to hold their single token in accounts.token_hash: move it to tokens, then drop the column.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = current_schema() and table_name = 'accounts' and column_name = 'token_hash'
  ) then
    insert into tokens (token_hash, account_id, created_at)
      select token_hash, id, created_at from accounts where token_hash is not null
      on conflict (token_hash) do nothing;
    alter table accounts drop column token_hash;
  end if;
end $$;

-- Pending email sign-in codes (one per email; a new request replaces the old code).
create table if not exists login_codes (
  email       text primary key,
  code_hash   text not null,                -- sha256 of email and code; the code itself is never stored
  expires_at  timestamptz not null,
  attempts    integer not null default 0    -- wrong guesses; the code is burnt after 5
);

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
