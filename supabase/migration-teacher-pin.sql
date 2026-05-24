-- ============================================================
-- Migration: Add Teacher PIN Authentication
-- Run this in Supabase SQL Editor
-- ============================================================

-- Create teacher_credentials table
create table if not exists teacher_credentials (
  id          text primary key default gen_random_uuid()::text,
  pin         text not null unique,
  teacher_name text not null,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Insert teacher PIN (122922)
insert into teacher_credentials (pin, teacher_name)
values ('122922', 'อ.อาหมัดนาวาวี')
on conflict(pin) do nothing;

-- Enable RLS (Row Level Security) - allow anyone to check PIN
alter table teacher_credentials enable row level security;

-- Policy: Allow read for PIN verification (no auth needed for public access)
create policy "allow_pin_verification" on teacher_credentials
  for select using (true);

-- ============================================================
-- Migration complete. Teachers can now log in with PIN.
-- ============================================================
