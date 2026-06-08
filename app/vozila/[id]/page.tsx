"use client";

import { useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/public/navbar";
import Footer from "@/components/public/footer";
import BookingModal from "@/components/public/booking-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, ArrowLeft, CalendarCheck, MessageSquare } from "lucide-react";
import Link from "next/link";
import type { Vehicle } from "@/types/database";

const FUEL_LABELS: Record<string, string> = {
  petrol: "Benzin", diesel: "Diesel", electric: "Električno", hybrid: "Hibrid", lpg: "LPG",
};

export default function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [vehicle, setVehicle] = useState<Vehicle | null | "loading">("loading");
  const [bookingOpen, setBookingOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

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
        <main className="max-w-5xl mx-auto px-4 py-12">
          <div className="h-96 bg-secondary rounded-xl animate-pulse" />
        </main>
        <Footer />
      </>
    );
  }

  if (!vehicle) return null;

  const v = vehicle;

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-12">
        <Link href="/vozila" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Nazad na vozila
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images with booking button overlay */}
          <div>
            <div className="relative group rounded-xl overflow-hidden mb-3">
              {v.images?.[activeImage] ? (
                <img
                  src={v.images[activeImage]}
                  alt={`${v.brand} ${v.model}`}
                  className="w-full aspect-video object-cover"
                />
              ) : (
                <div className="w-full aspect-video bg-secondary flex items-center justify-center">
                  <Car className="w-16 h-16 text-muted-foreground/30" />
                </div>
              )}
              {/* Book test drive overlay button */}
              {v.status === "available" && (
                <div className="absolute inset-0 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 to-transparent">
                  <Button
                    onClick={() => setBookingOpen(true)}
                    className="gap-2 shadow-lg"
                    size="lg"
                  >
                    <CalendarCheck className="w-4 h-4" />
                    Zakaži test vožnju
                  </Button>
                </div>
              )}
            </div>

            {v.images && v.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {v.images.slice(0, 4).map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                      activeImage === i ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <h1 className="text-3xl font-black mb-1">{v.brand} {v.model}</h1>
            <p className="text-muted-foreground mb-4">{v.year}{v.body_type ? ` · ${v.body_type}` : ""}</p>
            <p className="text-3xl font-black text-primary mb-6">{v.price.toLocaleString()} {v.currency}</p>

            <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
              {[
                { label: "Kilometraža", value: `${v.mileage.toLocaleString()} km` },
                { label: "Gorivo", value: FUEL_LABELS[v.fuel_type] ?? v.fuel_type },
                { label: "Mjenjač", value: v.transmission === "automatic" ? "Automatski" : "Manuelni" },
                { label: "Motor", value: v.engine_size },
                { label: "Snaga", value: v.power },
                { label: "Boja", value: v.color },
                { label: "Vrata", value: v.doors },
                { label: "Sjedišta", value: v.seats },
              ].filter(({ value }) => value != null).map(({ label, value }) => (
                <div key={label} className="bg-secondary rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-medium">{String(value)}</p>
                </div>
              ))}
            </div>

            {v.features?.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold mb-2">Oprema</h3>
                <div className="flex flex-wrap gap-2">
                  {v.features.map((f: string, i: number) => (
                    <Badge key={i} variant="outline">{f}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* CTA buttons */}
            <div className="space-y-3">
              {v.status === "available" && (
                <Button
                  onClick={() => setBookingOpen(true)}
                  size="lg"
                  className="w-full gap-2"
                >
                  <CalendarCheck className="w-4 h-4" />
                  Zakaži test vožnju
                </Button>
              )}
              <Button asChild variant="outline" size="lg" className="w-full gap-2">
                <Link href={`/kontakt?vozilo=${encodeURIComponent(`${v.brand} ${v.model} ${v.year}`)}`}>
                  <MessageSquare className="w-4 h-4" />
                  Pošalji upit
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {v.description && (
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-3">Opis</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{v.description}</p>
          </div>
        )}
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
