-- Del Auto — Full database schema
-- Run this in Supabase Dashboard → SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── VEHICLES ──────────────────────────────────────────────
create table if not exists vehicles (
  id uuid primary key default uuid_generate_v4(),
  brand text not null,
  model text not null,
  year integer not null,
  price numeric not null,
  currency text not null default 'EUR',
  mileage integer not null default 0,
  fuel_type text not null default 'petrol',
  transmission text not null default 'manual',
  body_type text,
  color text,
  engine_size text,
  power text,
  doors integer,
  seats integer,
  features text[] default '{}',
  description text,
  images text[] default '{}',
  status text not null default 'available',
  arrival_status text,
  expected_arrival_date text,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

alter table vehicles enable row level security;
create policy "Public read vehicles" on vehicles for select using (true);
create policy "Service write vehicles" on vehicles for all using (auth.role() = 'service_role');

-- ── OPERATIONS ────────────────────────────────────────────
create table if not exists operations (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text not null unique,
  description text,
  content text,
  images text[] default '{}',
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table operations enable row level security;
create policy "Public read operations" on operations for select using (true);
create policy "Service write operations" on operations for all using (auth.role() = 'service_role');

-- ── NEWS ──────────────────────────────────────────────────
create table if not exists news (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text,
  category text,
  featured_image text,
  is_published boolean not null default false,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table news enable row level security;
create policy "Public read news" on news for select using (true);
create policy "Service write news" on news for all using (auth.role() = 'service_role');

-- ── TESTIMONIALS ──────────────────────────────────────────
create table if not exists testimonials (
  id uuid primary key default uuid_generate_v4(),
  customer_name text not null,
  rating integer not null default 5,
  text text not null,
  vehicle_purchased text,
  is_approved boolean not null default false,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

alter table testimonials enable row level security;
create policy "Public read approved testimonials" on testimonials for select using (true);
create policy "Service write testimonials" on testimonials for all using (auth.role() = 'service_role');

-- ── PARTNERS ──────────────────────────────────────────────
create table if not exists partners (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  logo_url text,
  website_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table partners enable row level security;
create policy "Public read partners" on partners for select using (true);
create policy "Service write partners" on partners for all using (auth.role() = 'service_role');

-- ── BOOKINGS ──────────────────────────────────────────────
create table if not exists bookings (
  id uuid primary key default uuid_generate_v4(),
  vehicle_id uuid references vehicles(id) on delete set null,
  vehicle_name text,
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  date date not null,
  time_slot text not null,
  status text not null default 'new',
  notes text,
  created_at timestamptz not null default now()
);

alter table bookings enable row level security;
create policy "Service all bookings" on bookings for all using (auth.role() = 'service_role');
create policy "Anon insert bookings" on bookings for insert with check (true);

-- ── INQUIRIES ─────────────────────────────────────────────
create table if not exists inquiries (
  id uuid primary key default uuid_generate_v4(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  message text not null,
  vehicle_name text,
  status text not null default 'new',
  created_at timestamptz not null default now()
);

alter table inquiries enable row level security;
create policy "Service all inquiries" on inquiries for all using (auth.role() = 'service_role');
create policy "Anon insert inquiries" on inquiries for insert with check (true);

-- ── SITE SETTINGS ─────────────────────────────────────────
create table if not exists site_settings (
  id uuid primary key default uuid_generate_v4(),
  key text not null unique,
  value text,
  created_at timestamptz not null default now()
);

alter table site_settings enable row level security;
create policy "Public read settings" on site_settings for select using (true);
create policy "Service write settings" on site_settings for all using (auth.role() = 'service_role');

-- Default settings
insert into site_settings (key, value) values
  ('phone', '+387 61 199 645'),
  ('email', 'info@delauto.ba'),
  ('address', 'Džemala Bijedića 168, Sarajevo')
on conflict (key) do nothing;
