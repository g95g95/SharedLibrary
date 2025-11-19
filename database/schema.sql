set search_path to public;

create table if not exists authors (
  id bigserial primary key,
  name text not null,
  birth_year int,
  death_year int
);

create table if not exists genres (
  id bigserial primary key,
  name text not null unique
);

create table if not exists books (
  id bigserial primary key,
  title text not null,
  author_id bigint references authors(id) on delete set null,
  genre_id bigint references genres(id) on delete set null,
  state int default 1,
  publication_year int,
  publisher text,
  description text,
  language text default 'italiano',
  owner_id bigint references app_users(id) on delete set null,
  village_id bigint references villages(id) on delete set null,
  condition_id smallint references conditions(id) on delete set null
);

create table if not exists conditions (
  id smallserial primary key,
  name text unique not null
);

insert into conditions (name)
values 
  ('Ottimo'),
  ('Buono'),
  ('Cattivo'),
  ('Molto cattivo')
on conflict (name) do nothing;

create table if not exists library_users (
  id bigserial primary key,
  full_name text not null,
  email text unique,
  created_at timestamptz default now()
);

create table if not exists app_users (
  id bigserial primary key,
  username text not null unique,
  password_hash text not null,
  email text unique,
  full_name text,
  village bigint references villages(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists loans (
  id bigserial primary key,
  book_id bigint not null references books(id) on delete cascade,
  user_id bigint not null references library_users(id) on delete cascade,
  loan_date date not null default current_date,
  due_date date,
  return_date date
);

create table if not exists villages (
  id bigserial primary key,
  name text not null,
  country text default 'Italy',
  region text,
  province text,
  postal_code text,
  latitude double precision,
  longitude double precision,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_books_title on books using gin (to_tsvector('simple', title));
create index if not exists idx_books_author_id on books(author_id);
create index if not exists idx_books_genre_id on books(genre_id);
create index if not exists idx_books_village_id on books(village_id);
create index if not exists idx_loans_book_id on loans(book_id);
create index if not exists idx_loans_user_id on loans(user_id);
create index if not exists idx_villages_name on villages using gin (to_tsvector('simple', name));
create index if not exists idx_villages_coords on villages (latitude, longitude);

create or replace function update_timestamp()
returns trigger as $$
begin
   new.updated_at = now();
   return new;
end;
$$ language plpgsql;

create trigger villages_update_ts
before update on villages
for each row
execute procedure update_timestamp();
