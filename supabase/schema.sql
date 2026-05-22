-- ============================================================
-- ครูดิจิทัล — Classroom Manager schema
-- Run this in Supabase SQL Editor (one-time setup)
-- ============================================================

-- ---------- Tables ----------

create table if not exists classes (
  id          text primary key,
  name        text not null,
  code        text not null,
  color       text not null default '#4F46E5',
  room        text default '',
  "time"      text default '',
  created_at  timestamptz default now()
);

create table if not exists students (
  id          text primary key,
  class_id    text references classes(id) on delete cascade,
  no          int  not null default 1,
  prefix      text default 'เด็กชาย',
  name        text not null,
  surname     text default '',
  nick        text default '',
  avatar      text default '#FDE68A',
  comment     text default '',
  -- legacy attendance summary (kept for student detail card; recomputed from attendance table on demand)
  att_present int default 0,
  att_absent  int default 0,
  att_leave   int default 0,
  att_skip    int default 0,
  created_at  timestamptz default now()
);
create index if not exists students_class_id_idx on students(class_id);

create table if not exists score_categories (
  key         text primary key,
  label       text not null,
  max         int  not null default 10,
  color       text default '#8B5CF6',
  sort_order  int  default 0,
  created_at  timestamptz default now()
);

create table if not exists scores (
  student_id   text references students(id) on delete cascade,
  category_key text references score_categories(key) on delete cascade,
  value        numeric default 0,
  updated_at   timestamptz default now(),
  primary key (student_id, category_key)
);

create table if not exists attendance (
  class_id    text references classes(id) on delete cascade,
  date        date not null,
  student_id  text references students(id) on delete cascade,
  status      text check (status in ('present','absent','leave','skip')),
  updated_at  timestamptz default now(),
  primary key (class_id, date, student_id)
);
create index if not exists attendance_class_date_idx on attendance(class_id, date);

create table if not exists notes (
  id          text primary key,
  class_id    text references classes(id) on delete cascade,
  kind        text default 'note',
  text        text not null,
  due_date    date,
  pinned      boolean default false,
  created_at  timestamptz default now()
);
create index if not exists notes_class_id_idx on notes(class_id);

create table if not exists schedule (
  day         int not null,
  slot        int not null,
  class_id    text references classes(id) on delete cascade,
  primary key (day, slot)
);

-- ---------- Row Level Security ----------
-- Single-teacher trust model: anon (publishable) key has full read/write.
-- Student QR view also uses the same key for read-only access.
-- If you later add multi-teacher support, tighten these per-row by teacher_id.

alter table classes          enable row level security;
alter table students         enable row level security;
alter table score_categories enable row level security;
alter table scores           enable row level security;
alter table attendance       enable row level security;
alter table notes            enable row level security;
alter table schedule         enable row level security;

do $$
declare t text;
begin
  foreach t in array array['classes','students','score_categories','scores','attendance','notes','schedule']
  loop
    execute format('drop policy if exists "anon_all" on %I', t);
    execute format('create policy "anon_all" on %I for all to anon using (true) with check (true)', t);
    -- Also allow authenticated for future use
    execute format('drop policy if exists "auth_all" on %I', t);
    execute format('create policy "auth_all" on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- ---------- Realtime (optional but recommended for live updates across tabs/devices) ----------
-- Idempotent: only add tables that aren't already in the publication.
do $$
declare t text;
begin
  foreach t in array array['classes','students','score_categories','scores','attendance','notes','schedule']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table %I', t);
    end if;
  end loop;
end $$;
