import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/public/navbar";
import Footer from "@/components/public/footer";
import { Newspaper } from "lucide-react";
import { format } from "date-fns";

export const metadata = { title: "Vijesti — Del Auto" };

export default async function NewsPage() {
  const supabase = await createClient();
  const { data: news } = await supabase
    .from("news")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Page header */}
        <div className="bg-navy text-white py-14 px-4">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase mb-2">
              Vijesti i savjeti
            </p>
            <h1 className="text-4xl md:text-5xl font-black">Blog</h1>
            <p className="text-white/55 mt-2">
              Najnovije vijesti, savjeti i obavijesti iz Del Auto.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12">
          {!news?.length ? (
            <div className="text-center py-24 text-muted-foreground">
              <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="font-medium">Nema objavljenih vijesti.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {news.map((n) => (
                <Link key={n.id} href={`/vijesti/${n.slug}`} className="group">
                  <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-md hover:border-primary/30 transition-all h-full flex flex-col">
                    {n.featured_image ? (
                      <img
                        src={n.featured_image}
                        alt={n.title}
                        className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-44 bg-secondary flex items-center justify-center">
                        <Newspaper className="w-10 h-10 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-2">
                        {n.category && (
                          <p className="text-xs font-bold text-primary uppercase tracking-wider">
                            {n.category}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground ml-auto">
                          {format(new Date(n.published_at), "dd.MM.yyyy")}
                        </p>
                      </div>
                      <h3 className="font-bold text-foreground mb-2 line-clamp-2 leading-snug">
                        {n.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 flex-1 leading-relaxed">
                        {n.excerpt}
                      </p>
                      <p className="text-xs font-bold text-primary mt-3">
                        Čitaj više →
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
