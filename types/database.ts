export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      vehicles: {
        Row: Vehicle;
        Insert: Omit<Vehicle, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Vehicle, "id" | "created_at">>;
      };
      operations: {
        Row: Operation;
        Insert: Omit<Operation, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Operation, "id" | "created_at">>;
      };
      news: {
        Row: NewsArticle;
        Insert: Omit<NewsArticle, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<NewsArticle, "id" | "created_at">>;
      };
      testimonials: {
        Row: Testimonial;
        Insert: Omit<Testimonial, "id" | "created_at">;
        Update: Partial<Omit<Testimonial, "id" | "created_at">>;
      };
      partners: {
        Row: Partner;
        Insert: Omit<Partner, "id" | "created_at">;
        Update: Partial<Omit<Partner, "id" | "created_at">>;
      };
      bookings: {
        Row: Booking;
        Insert: Omit<Booking, "id" | "created_at">;
        Update: Partial<Omit<Booking, "id" | "created_at">>;
      };
      inquiries: {
        Row: Inquiry;
        Insert: Omit<Inquiry, "id" | "created_at">;
        Update: Partial<Omit<Inquiry, "id" | "created_at">>;
      };
      site_settings: {
        Row: SiteSetting;
        Insert: Omit<SiteSetting, "id">;
        Update: Partial<Omit<SiteSetting, "id">>;
      };
    };
  };
}

export interface Profile {
  id: string;
  email: string | null;
  name: string | null;
  role: "admin" | "staff";
  created_at: string;
}

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  vin: string | null;
  mileage: number;
  fuel_type: "petrol" | "diesel" | "electric" | "hybrid" | "lpg";
  transmission: "manual" | "automatic";
  price: number;
  currency: string;
  color: string | null;
  engine_size: string | null;
  power: string | null;
  description: string;
  features: string[];
  images: string[];
  videos: string[];
  status: "available" | "reserved" | "sold" | "upcoming";
  is_featured: boolean;
  is_service_sale: boolean;
  expected_arrival_date: string | null;
  arrival_status: "coming_soon" | "in_transit" | "arriving_this_week" | "reserved" | null;
  doors: number | null;
  seats: number | null;
  body_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface Operation {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  images: string[];
  videos: string[];
  category: string;
  published_at: string;
  is_published: boolean;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string | null;
  gallery: string[];
  category: string;
  published_at: string;
  is_published: boolean;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  customer_name: string;
  customer_photo: string | null;
  vehicle_purchased: string | null;
  rating: number;
  text: string;
  is_featured: boolean;
  is_approved: boolean;
  date: string;
  created_at: string;
}

export interface Partner {
  id: string;
  name: string;
  logo: string | null;
  description: string | null;
  website: string | null;
  category: "bank" | "leasing" | "insurance" | "logistics" | "corporate" | "other";
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Booking {
  id: string;
  type: "test_drive" | "showroom_viewing" | "video_viewing" | "service";
  vehicle_id: string | null;
  vehicle_name: string | null;
  service_id: string | null;
  service_name: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  preferred_date: string;
  preferred_time: string | null;
  message: string | null;
  status: "new" | "confirmed" | "completed" | "cancelled";
  created_at: string;
}

export interface Inquiry {
  id: string;
  vehicle_id: string | null;
  vehicle_name: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  message: string;
  status: "new" | "contacted" | "in_progress" | "closed";
  interested_in_upcoming: boolean | null;
  created_at: string;
}

export interface SiteSetting {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}

export interface Service {
  id: string;
  name: string;
  description: string | null;
  image: string | null;
  price_from: number | null;
  price_unit: string;
  is_active: boolean;
  is_schedulable: boolean;
  schedule_from: string | null;
  schedule_to: string | null;
  schedule_time_from: string | null;
  schedule_time_to: string | null;
  schedule_weekdays: boolean;
  schedule_saturday: boolean;
  schedule_sunday: boolean;
  sort_order: number;
  created_at: string;
}
