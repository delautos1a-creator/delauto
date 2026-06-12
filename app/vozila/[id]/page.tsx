"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/public/navbar";
import Footer from "@/components/public/footer";
import BookingModal from "@/components/public/booking-modal";
import ImageCarousel from "@/components/public/image-carousel";
import Link from "next/link";
import type { Vehicle } from "@/types/database";
import { ArrowLeft, CalendarCheck, MessageSquare, Gauge, Fuel, Settings2, Calendar, Palette, DoorOpen, Users, Car } from "lucide-react";

const FUEL_LABELS: Record<string, string> = {
  petrol: "Benzin", diesel: "Diesel", electric: "Električno", hybrid: "Hibrid", lpg: "LPG",
};

const TRANS_LABELS: Record<string, string> = {
  manual: "Manuelni", automatic: "Automatski",
};

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null | "loading">("loading");
  const [bookingOpen, setBookingOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("vehicles").select("*").eq("id", id).single().then(({ data }) => {
      setVehicle((data as Vehicle) ?? null);
    });
  }, [id]);

  if (vehicle === "loading") {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-background">
          <div className="max-w-5xl mx-auto px-4 py-12">
            <div className="h-96 bg-card rounded-2xl animate-pulse" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!vehicle) return null;

  const v = vehicle;

  const specs = [
    { icon: Calendar, label: "Godište", value: String(v.year) },
    { icon: Gauge, label: "Kilometraža", value: `${v.mileage.toLocaleString("de-DE")} km` },
    { icon: Fuel, label: "Gorivo", value: FUEL_LABELS[v.fuel_type] ?? v.fuel_type },
    { icon: Settings2, label: "Mjenjač", value: TRANS_LABELS[v.transmission] ?? v.transmission },
    ...(v.engine_size ? [{ icon: Car, label: "Motor", value: v.engine_size }] : []),
    ...(v.power ? [{ icon: Gauge, label: "Snaga", value: v.power }] : []),
    ...(v.color ? [{ icon: Palette, label: "Boja", value: v.color }] : []),
    ...(v.doors ? [{ icon: DoorOpen, label: "Vrata", value: String(v.doors) }] : []),
    ...(v.seats ? [{ icon: Users, label: "Sjedišta", value: String(v.seats) }] : []),
  ];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Back link bar */}
        <div className="bg-navy border-b border-white/10">
          <div className="max-w-5xl mx-auto px-4 py-4">
            <Link
              href="/vozila"
              className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Nazad na vozila
            </Link>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Images */}
            <div>
              <ImageCarousel
                images={v.images ?? []}
                alt={`${v.brand} ${v.model}`}
                badge={
                  v.status === "sold" ? (
                    <span className="absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full bg-red-500 text-white z-10">
                      Prodano
                    </span>
                  ) : v.status === "reserved" ? (
                    <span className="absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full bg-amber-400 text-amber-900 z-10">
                      Rezervisano
                    </span>
                  ) : null
                }
              />
            </div>

            {/* Details */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                  {v.brand}
                </p>
                {v.is_service_sale && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-600/20 text-violet-400 border border-violet-500/30 uppercase tracking-wide">
                    Uslužna prodaja
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-black text-foreground mb-1">
                {v.model}{v.engine_size ? ` ${v.engine_size}` : ""}
              </h1>
              {v.body_type && (
                <p className="text-muted-foreground text-sm mb-4">{v.year} · {v.body_type}</p>
              )}
              {v.status !== "sold" && (
                <p className="text-4xl font-black text-primary mb-6">
                  {v.price.toLocaleString("de-DE")} {v.currency}
                </p>
              )}

              {/* Specs grid */}
              <div className="grid grid-cols-2 gap-2 mb-6">
                {specs.map(({ icon: Icon, label, value }) => (
                  <div key={label} className="bg-card rounded-xl border border-border p-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </div>
                    <p className="font-semibold text-sm text-foreground">{value}</p>
                  </div>
                ))}
              </div>

              {/* Features */}
              {v.features?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-bold text-foreground mb-3">Oprema</h3>
                  <div className="flex flex-wrap gap-2">
                    {v.features.map((f: string, i: number) => (
                      <span
                        key={i}
                        className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA buttons */}
              <div className="space-y-3">
                {v.status === "sold" ? (
                  <div className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                    Ovo vozilo je prodano
                  </div>
                ) : (
                  <>
                    {v.status === "available" && (
                      <button
                        onClick={() => setBookingOpen(true)}
                        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                      >
                        <CalendarCheck className="w-4 h-4" />
                        Zakaži test vožnju
                      </button>
                    )}
                    <Link
                      href={`/kontakt?vozilo=${encodeURIComponent(`${v.brand} ${v.model} ${v.year}`)}`}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-card transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Pošalji upit
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {v.description && (
            <div className="mt-10 bg-card rounded-2xl border border-border p-6">
              <h2 className="text-lg font-bold text-foreground mb-3">Opis vozila</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm">
                {v.description}
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />

      <BookingModal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        vehicleId={v.id}
        vehicleName={`${v.brand} ${v.model} ${v.year}`}
      />
    </>
  );
}
