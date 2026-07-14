import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/public/navbar";
import Footer from "@/components/public/footer";
import ImageCarousel from "@/components/public/image-carousel";
import VehicleBookingButton from "@/components/public/vehicle-booking-button";
import PriceTag from "@/components/public/price-tag";
import Link from "next/link";
import type { Vehicle } from "@/types/database";
import { ArrowLeft, MessageSquare, Gauge, Fuel, Settings2, Calendar, Palette, DoorOpen, Users, Car } from "lucide-react";

const FUEL_LABELS: Record<string, string> = {
  petrol: "Benzin", diesel: "Diesel", electric: "Električno", hybrid: "Hibrid", lpg: "LPG",
};

const TRANS_LABELS: Record<string, string> = {
  manual: "Manuelni", automatic: "Automatski",
};

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("vehicles").select("*").eq("id", id).single();

  if (!data) notFound();
  const v = data as Vehicle;

  const vehicleName = `${v.brand} ${v.model} ${v.year}`;

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
                <div className="mb-6">
                  <PriceTag
                    price={v.price}
                    discountPrice={v.discount_price}
                    currency={v.currency}
                    className="text-4xl font-black text-primary"
                  />
                </div>
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
                      <VehicleBookingButton vehicleId={v.id} vehicleName={vehicleName} />
                    )}
                    <Link
                      href={`/kontakt?vozilo=${encodeURIComponent(vehicleName)}`}
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
    </>
  );
}
