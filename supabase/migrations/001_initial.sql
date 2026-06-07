-- Del Auto database schema
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ypqsjxnhmnhfxpitutxh/sql

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'staff')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name', COALESCE(NEW.raw_user_meta_data->>'role', 'staff'));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- VEHICLES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  vin TEXT,
  mileage INTEGER NOT NULL DEFAULT 0,
  fuel_type TEXT NOT NULL DEFAULT 'petrol' CHECK (fuel_type IN ('petrol', 'diesel', 'electric', 'hybrid', 'lpg')),
  transmission TEXT NOT NULL DEFAULT 'manual' CHECK (transmission IN ('manual', 'automatic')),
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  color TEXT,
  engine_size TEXT,
  power TEXT,
  description TEXT NOT NULL DEFAULT '',
  features TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'upcoming')),
  is_featured BOOLEAN NOT NULL DEFAULT false,
  expected_arrival_date TEXT,
  arrival_status TEXT CHECK (arrival_status IN ('coming_soon', 'in_transit', 'arriving_this_week', 'reserved')),
  doors INTEGER,
  seats INTEGER,
  body_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vehicles are publicly readable"
  ON public.vehicles FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can insert vehicles"
  ON public.vehicles FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update vehicles"
  ON public.vehicles FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can delete vehicles"
  ON public.vehicles FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE INDEX idx_vehicles_status ON public.vehicles(status);
CREATE INDEX idx_vehicles_featured ON public.vehicles(is_featured);
CREATE INDEX idx_vehicles_brand ON public.vehicles(brand);

-- ============================================================
-- OPERATIONS (Services)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.operations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  images TEXT[] DEFAULT '{}',
  videos TEXT[] DEFAULT '{}',
  category TEXT NOT NULL,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  is_published BOOLEAN NOT NULL DEFAULT false,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published operations are publicly readable"
  ON public.operations FOR SELECT USING (is_published = true OR auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can manage operations"
  ON public.operations FOR ALL
  USING (auth.role() = 'authenticated');

CREATE INDEX idx_operations_published ON public.operations(is_published);
CREATE INDEX idx_operations_slug ON public.operations(slug);

-- ============================================================
-- NEWS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.news (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  featured_image TEXT,
  gallery TEXT[] DEFAULT '{}',
  category TEXT NOT NULL DEFAULT 'announcement',
  published_at TIMESTAMPTZ DEFAULT NOW(),
  is_published BOOLEAN NOT NULL DEFAULT false,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published news are publicly readable"
  ON public.news FOR SELECT USING (is_published = true OR auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can manage news"
  ON public.news FOR ALL
  USING (auth.role() = 'authenticated');

CREATE INDEX idx_news_published ON public.news(is_published);
CREATE INDEX idx_news_slug ON public.news(slug);

-- ============================================================
-- TESTIMONIALS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_photo TEXT,
  vehicle_purchased TEXT,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  text TEXT NOT NULL,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved testimonials are publicly readable"
  ON public.testimonials FOR SELECT USING (is_approved = true OR auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can manage testimonials"
  ON public.testimonials FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================
-- PARTNERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  description TEXT,
  website TEXT,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('bank', 'leasing', 'insurance', 'logistics', 'corporate', 'other')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active partners are publicly readable"
  ON public.partners FOR SELECT USING (is_active = true OR auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can manage partners"
  ON public.partners FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================================
-- BOOKINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('test_drive', 'showroom_viewing', 'video_viewing')),
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  vehicle_name TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create a booking"
  ON public.bookings FOR INSERT WITH CHECK (true);

CREATE POLICY "Only authenticated users can view and manage bookings"
  ON public.bookings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update bookings"
  ON public.bookings FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can delete bookings"
  ON public.bookings FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE INDEX idx_bookings_status ON public.bookings(status);

-- ============================================================
-- INQUIRIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  vehicle_name TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'in_progress', 'closed')),
  interested_in_upcoming BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create an inquiry"
  ON public.inquiries FOR INSERT WITH CHECK (true);

CREATE POLICY "Only authenticated users can view and manage inquiries"
  ON public.inquiries FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update inquiries"
  ON public.inquiries FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can delete inquiries"
  ON public.inquiries FOR DELETE
  USING (auth.role() = 'authenticated');

CREATE INDEX idx_inquiries_status ON public.inquiries(status);

-- ============================================================
-- SITE SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Site settings are publicly readable"
  ON public.site_settings FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can manage site settings"
  ON public.site_settings FOR ALL
  USING (auth.role() = 'authenticated');

-- Insert default site settings
INSERT INTO public.site_settings (key, value) VALUES
  ('site_name', 'Del Auto'),
  ('site_phone', '+387 61 000 000'),
  ('site_email', 'info@delauto.ba'),
  ('site_address', 'Sarajevo, BiH'),
  ('site_instagram', ''),
  ('site_facebook', ''),
  ('site_working_hours', 'Pon-Pet 09:00-18:00, Sub 09:00-14:00')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- STORAGE BUCKET for images
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicles', 'vehicles', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view vehicle images"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('vehicles', 'media'));

CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' AND bucket_id IN ('vehicles', 'media'));

CREATE POLICY "Authenticated users can delete images"
  ON storage.objects FOR DELETE
  USING (auth.role() = 'authenticated' AND bucket_id IN ('vehicles', 'media'));
