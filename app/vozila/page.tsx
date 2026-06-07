import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/public/navbar";
import Footer from "@/components/public/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car } from "lucide-react";

export const metadata = { title: "Vozila — Del Auto" };

export default async function VehiclesPage() {
  const supabase = await createClient();
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("*")
    .in("status", ["available", "reserved"])
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  const STATUS_LABELS: Record<string, string> = {
    available: "Dostupno", reserved: "Rezervisano",
  };
  const STATUS_COLORS: Record<string, string> = {
    available: "bg-green-500/20 text-green-400 border-green-500/30",
    reserved: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  };

  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">Vozila</h1>
          <p className="text-muted-foreground">{vehicles?.length ?? 0} vozila dostupno</p>
        </div>
        {!vehicles?.length ? (
          <div className="text-center py-20 text-muted-foreground">
            <Car className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>Trenutno nema dostupnih vozila.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((v) => (
              <Link key={v.id} href={`/vozila/${v.id}`}>
                <Card className="border-border hover:border-primary/40 transition-all overflow-hidden group h-full">
                  {v.images?.[0] ? (
                    <img src={v.images[0]} alt={`${v.brand} ${v.model}`} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-48 bg-secondary flex items-center justify-center">
                      <Car className="w-12 h-12 text-muted-foreground/30" />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-bold">{v.brand} {v.model}</p>
                      <Badge className={STATUS_COLORS[v.status]}>{STATUS_LABELS[v.status]}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{v.year} · {v.mileage.toLocaleString()} km · {v.fuel_type}</p>
                    <p className="text-primary font-semibold">{v.price.toLocaleString()} {v.currency}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
