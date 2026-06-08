import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/public/navbar";
import Footer from "@/components/public/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, ArrowRight } from "lucide-react";
import type { Vehicle } from "@/types/database";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: featuredVehicles } = await supabase
    .from("vehicles")
    .select("*")
    .eq("is_featured", true)
    .eq("status", "available")
    .limit(6);

  return (
    <>
      <Navbar />
      <main className="flex-1">
        {/* Hero — put hero-bg.jpg in /public to enable background image */}
        <section
          className="relative min-h-[85vh] flex items-center justify-center text-center"
          style={{
            backgroundImage: "url('/hero-bg.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Dark overlay so text stays readable over the photo */}
          <div className="absolute inset-0 bg-black/55" />

          <div className="relative z-10 px-4 py-24">
            <Badge variant="outline" className="mb-6 border-white/30 text-white/80 bg-white/10 backdrop-blur-sm">
              Premium uvoz vozila
            </Badge>
            <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight text-white drop-shadow-lg">
              Vaš partner za<br />
              <span className="text-primary">premium vozila</span>
            </h1>
            <p className="text-lg text-white/70 mb-10 max-w-xl mx-auto">
              Uvoz, inspekcija, priprema i isporuka — sve na jednom mjestu.
              Sarajevo, BiH.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Button asChild size="lg" className="shadow-lg">
                <Link href="/vozila">Pogledaj vozila <ArrowRight className="ml-2 w-4 h-4" /></Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-white/40 text-white hover:bg-white/10 backdrop-blur-sm">
                <Link href="/kontakt">Kontaktirajte nas</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Featured vehicles */}
        {featuredVehicles && featuredVehicles.length > 0 && (
          <section className="max-w-7xl mx-auto px-4 pb-20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black">Istaknuta vozila</h2>
              <Link href="/vozila" className="text-sm text-primary hover:underline flex items-center gap-1">
                Sva vozila <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(featuredVehicles as Vehicle[]).map((v) => (
                <Link key={v.id} href={`/vozila/${v.id}`}>
                  <Card className="border-border hover:border-primary/40 transition-all overflow-hidden group">
                    {v.images?.[0] ? (
                      <img
                        src={v.images[0]}
                        alt={`${v.brand} ${v.model}`}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-48 bg-secondary flex items-center justify-center">
                        <Car className="w-12 h-12 text-muted-foreground/30" />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <p className="font-bold">{v.brand} {v.model}</p>
                      <p className="text-sm text-muted-foreground">{v.year} · {v.mileage.toLocaleString()} km</p>
                      <p className="text-primary font-semibold mt-2">{v.price.toLocaleString()} {v.currency}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Services CTA */}
        <section className="bg-card border-y border-border">
          <div className="max-w-7xl mx-auto px-4 py-16 text-center">
            <h2 className="text-2xl font-black mb-4">Naše usluge</h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Od nabave do isporuke — kompletna usluga uvoza i prodaje vozila.
            </p>
            <Button asChild variant="outline">
              <Link href="/operacije">Pogledaj operacije</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
