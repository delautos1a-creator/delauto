import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/public/navbar";
import Footer from "@/components/public/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: v } = await supabase.from("vehicles").select("*").eq("id", id).single();

  if (!v) notFound();

  const FUEL_LABELS: Record<string, string> = {
    petrol: "Benzin", diesel: "Diesel", electric: "Električno", hybrid: "Hibrid", lpg: "LPG",
  };

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-12">
        <Link href="/vozila" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Nazad na vozila
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            {v.images?.[0] ? (
              <img src={v.images[0]} alt={`${v.brand} ${v.model}`} className="w-full aspect-video object-cover rounded-xl mb-3" />
            ) : (
              <div className="w-full aspect-video bg-secondary rounded-xl flex items-center justify-center mb-3">
                <Car className="w-16 h-16 text-muted-foreground/30" />
              </div>
            )}
            {v.images && v.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {v.images.slice(1, 5).map((img: string, i: number) => (
                  <img key={i} src={img} alt="" className="aspect-square object-cover rounded-lg" />
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            <h1 className="text-3xl font-black mb-1">{v.brand} {v.model}</h1>
            <p className="text-muted-foreground mb-4">{v.year} · {v.body_type}</p>
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

            <Button asChild size="lg" className="w-full">
              <Link href={`/kontakt?vozilo=${encodeURIComponent(`${v.brand} ${v.model} ${v.year}`)}`}>
                Pošalji upit za ovo vozilo
              </Link>
            </Button>
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
    </>
  );
}
