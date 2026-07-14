import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/public/navbar";
import Footer from "@/components/public/footer";
import PriceTag from "@/components/public/price-tag";
import { Car, Clock, Truck } from "lucide-react";

export const metadata = { title: "Uskoro — Del Auto" };

const FUEL_LABELS: Record<string, string> = {
  petrol: "Benzin", diesel: "Diesel", electric: "Električno", hybrid: "Hibrid", lpg: "LPG",
};

const ARRIVAL_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  coming_soon: { label: "Uskoro", color: "#42C4EC", bg: "rgba(66,196,236,0.12)", icon: Clock },
  in_transit: { label: "U transportu", color: "#f59e0b", bg: "rgba(245,158,11,0.12)", icon: Truck },
  arriving_this_week: { label: "Stiže ove sedmice", color: "#22c55e", bg: "rgba(34,197,94,0.12)", icon: Truck },
  reserved: { label: "Rezervisano", color: "#a855f7", bg: "rgba(168,85,247,0.12)", icon: Clock },
};

export default async function UscorPage() {
  const supabase = await createClient();
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .eq("status", "upcoming")
    .order("created_at", { ascending: false });

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Page header */}
        <div className="bg-navy text-white py-14 px-4">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase mb-2">
              U najavi
            </p>
            <h1 className="text-4xl md:text-5xl font-black">Uskoro dostupno</h1>
            <p className="text-white/55 mt-2">
              Vozila koja uskoro stižu u našu ponudu.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12">
          {!vehicles?.length ? (
            <div className="text-center py-24 text-muted-foreground">
              <Car className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="font-medium">Trenutno nema vozila u najavi.</p>
              <p className="text-sm mt-1">Provjerite ponovo uskoro.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {vehicles.map((v) => {
                const arrival = v.arrival_status ? ARRIVAL_CONFIG[v.arrival_status] : null;
                const Icon = arrival?.icon ?? Clock;
                return (
                  <div key={v.id} className="bg-card rounded-2xl border border-border overflow-hidden group">
                    <div className="relative h-48 overflow-hidden bg-secondary">
                      {v.images?.[0] ? (
                        <img
                          src={v.images[0]}
                          alt={`${v.brand} ${v.model}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-14 h-14 text-muted-foreground/20" />
                        </div>
                      )}
                      {arrival && (
                        <span
                          className="absolute top-3 left-3 flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: arrival.bg, color: arrival.color }}
                        >
                          <Icon className="w-3 h-3" />
                          {arrival.label}
                        </span>
                      )}
                    </div>

                    <div className="p-5">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">
                        {v.brand}
                      </p>
                      <h3 className="font-bold text-foreground mb-1">
                        {v.model}{v.engine_size ? ` ${v.engine_size}` : ""}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                        {v.year && <span>{v.year}</span>}
                        {v.fuel_type && <span>· {FUEL_LABELS[v.fuel_type] ?? v.fuel_type}</span>}
                      </div>

                      {v.expected_arrival_date && (
                        <p className="text-xs text-muted-foreground mb-3">
                          Očekivani dolazak:{" "}
                          <span className="text-foreground font-medium">{v.expected_arrival_date}</span>
                        </p>
                      )}

                      <PriceTag
                        price={v.price}
                        discountPrice={v.discount_price}
                        currency={v.currency}
                        className="text-xl font-black text-primary"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
