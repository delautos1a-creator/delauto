-- Add optional discount/special-offer price to vehicles.
-- When set (and lower than price), the public site shows the regular
-- price crossed out next to the discount price.
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS discount_price DECIMAL(12,2);
