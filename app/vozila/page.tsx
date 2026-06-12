import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/public/navbar";
import Footer from "@/components/public/footer";
import VehicleTabs from "@/components/public/vehicle-tabs";
import SoldSection from "@/components/public/sold-section";
import type { Vehicle } from "@/types/database";
import { Car } from "lucide-react";

export const metadata = { title: "Vozila — Del Auto" };

export default async function VehiclesPage() {
  const supabase = await createClient();

  const [{ data: vehicles }, { data: soldVehicles }] = await Promise.all([
    supabase
      .from("vehicles")
      .select("*")
      .in("status", ["available", "reserved", "upcoming"])
      .order("created_at", { ascending: false }),
    supabase
      .from("vehicles")
      .select("*")
      .eq("status", "sold")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Page header */}
        <div className="bg-navy text-white py-14 px-4">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase mb-2">
              Naša ponuda
            </p>
            <h1 className="text-4xl md:text-5xl font-black">Vozila</h1>
            <p className="text-white/55 mt-2">
              {vehicles?.length ?? 0} vozila dostupno
            </p>
          </div>
        </div>

        {/* Active vehicles */}
        <div className="max-w-7xl mx-auto px-4 py-12">
          {!vehicles?.length ? (
            <div className="text-center py-24 text-muted-foreground">
              <Car className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="font-medium">Trenutno nema dostupnih vozila.</p>
              <p className="text-sm mt-1">Pogledajte uskoro dostupna vozila.</p>
            </div>
          ) : (
            <VehicleTabs vehicles={vehicles as Vehicle[]} />
          )}
        </div>

        {/* Sold vehicles — collapsible section at the bottom */}
        {!!soldVehicles?.length && (
          <SoldSection vehicles={soldVehicles as Vehicle[]} />
        )}
      </main>
      <Footer />
    </>
  );
}
