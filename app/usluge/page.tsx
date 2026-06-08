import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/public/navbar";
import Footer from "@/components/public/footer";
import type { Service } from "@/types/database";
import { ConciergeBell } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Usluge — Del Auto" };

export default async function UslugePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  const services = (data ?? []) as Service[];

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-navy text-white py-14 px-4">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase mb-2">
              Šta nudimo
            </p>
            <h1 className="text-4xl md:text-5xl font-black">Naše usluge</h1>
            <p className="text-white/55 mt-2 max-w-xl">
              Pored prodaje vozila, nudimo kompletnu paletu usluga za vaš automobil.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-14">
          {services.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground">
              <ConciergeBell className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="font-medium">Usluge uskoro dostupne.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map((s) => (
                <div
                  key={s.id}
                  className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col hover:border-primary/30 transition-colors"
                >
                  {s.image ? (
                    <img
                      src={s.image}
                      alt={s.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-secondary flex items-center justify-center">
                      <ConciergeBell className="w-12 h-12 text-muted-foreground/25" />
                    </div>
                  )}
                  <div className="p-6 flex flex-col flex-1">
                    <h2 className="font-black text-lg text-foreground mb-2">{s.name}</h2>
                    {s.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                        {s.description}
                      </p>
                    )}
                    {s.price_from && (
                      <p className="mt-4 text-primary font-black text-xl">
                        od {s.price_from} {s.price_unit}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 text-center">
            <p className="text-muted-foreground mb-4">
              Imate pitanje o nekoj usluzi?
            </p>
            <Link
              href="/kontakt"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Kontaktirajte nas
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
