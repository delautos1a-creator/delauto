import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/public/navbar";
import Footer from "@/components/public/footer";
import { Wrench, ArrowRight } from "lucide-react";

export const metadata = { title: "Operacije — Del Auto" };

export default async function OperationsPage() {
  const supabase = await createClient();
  const { data: operations } = await supabase
    .from("operations")
    .select("*")
    .eq("is_published", true)
    .order("created_at");

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Page header */}
        <div className="bg-navy text-white py-14 px-4">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase mb-2">
              Šta nudimo
            </p>
            <h1 className="text-4xl md:text-5xl font-black">Operacije</h1>
            <p className="text-white/55 mt-2">
              Sve usluge koje nudimo — od nabave do isporuke.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12">
          {!operations?.length ? (
            <div className="text-center py-24 text-muted-foreground">
              <Wrench className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="font-medium">Nema objavljenih operacija.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {operations.map((op) => (
                <Link key={op.id} href={`/operacije/${op.slug}`} className="group">
                  <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-md hover:border-primary/30 transition-all h-full flex flex-col">
                    {op.images?.[0] ? (
                      <img
                        src={op.images[0]}
                        alt={op.title}
                        className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-44 bg-secondary flex items-center justify-center">
                        <Wrench className="w-10 h-10 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-foreground">{op.title}</h3>
                        <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {op.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
