import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/public/navbar";
import Footer from "@/components/public/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car } from "lucide-react";

export const metadata = { title: "Uskoro — Del Auto" };

const ARRIVAL_LABELS: Record<string, string> = {
  coming_soon: "Uskoro", in_transit: "U transportu",
  arriving_this_week: "Stiže ove sedmice", reserved: "Rezervisano",
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
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">Uskoro</h1>
          <p className="text-muted-foreground">Vozila koja uskoro stižu u našu ponudu.</p>
        </div>
        {!vehicles?.length ? (
          <div className="text-center py-20 text-muted-foreground">
            <Car className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>Trenutno nema vozila u najavi.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((v) => (
              <Card key={v.id} className="border-border overflow-hidden">
                {v.images?.[0] ? (
                  <img src={v.images[0]} alt={`${v.brand} ${v.model}`} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-secondary flex items-center justify-center">
                    <Car className="w-12 h-12 text-muted-foreground/30" />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-bold">{v.brand} {v.model}</p>
                    {v.arrival_status && (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 shrink-0">
                        {ARRIVAL_LABELS[v.arrival_status] ?? v.arrival_status}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{v.year} · {v.fuel_type}</p>
                  {v.expected_arrival_date && (
                    <p className="text-xs text-muted-foreground">Očekivani dolazak: {v.expected_arrival_date}</p>
                  )}
                  <p className="text-primary font-semibold mt-2">{v.price.toLocaleString()} {v.currency}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
