import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/public/navbar";
import Footer from "@/components/public/footer";
import { Card, CardContent } from "@/components/ui/card";
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
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">Operacije</h1>
          <p className="text-muted-foreground">Sve usluge koje nudimo — od nabave do isporuke.</p>
        </div>
        {!operations?.length ? (
          <div className="text-center py-20 text-muted-foreground">
            <Wrench className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>Nema objavljenih operacija.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {operations.map((op) => (
              <Link key={op.id} href={`/operacije/${op.slug}`}>
                <Card className="border-border hover:border-primary/40 transition-all group h-full">
                  {op.images?.[0] ? (
                    <img src={op.images[0]} alt={op.title} className="w-full h-44 object-cover rounded-t-xl group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-44 bg-secondary rounded-t-xl flex items-center justify-center">
                      <Wrench className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-bold">{op.title}</p>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">{op.description}</p>
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
