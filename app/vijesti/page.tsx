import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/public/navbar";
import Footer from "@/components/public/footer";
import { Newspaper } from "lucide-react";
import { format } from "date-fns";

export const metadata = { title: "Vijesti — Del Auto" };

export default async function NewsPage() {
  const supabase = await createClient();

  const [{ data: news }, { data: operations }] = await Promise.all([
    supabase.from("news").select("*").eq("is_published", true).order("published_at", { ascending: false }),
    supabase.from("operations").select("*").eq("is_published", true).order("published_at", { ascending: false }),
  ]);

  // Merge and sort newest first
  const combined = [
    ...(news ?? []).map((n) => ({
      id: n.id,
      title: n.title,
      slug: n.slug,
      excerpt: n.excerpt,
      image: n.featured_image ?? null,
      category: n.category,
      published_at: n.published_at,
      href: `/vijesti/${n.slug}`,
      badge: "Vijest",
    })),
    ...(operations ?? []).map((o) => ({
      id: o.id,
      title: o.title,
      slug: o.slug,
      excerpt: o.description,
      image: (o.images as string[])?.[0] ?? null,
      category: o.category,
      published_at: o.published_at,
      href: `/operacije/${o.slug}`,
      badge: "Operacija",
    })),
  ].sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="bg-navy text-white py-14 px-4">
          <div className="max-w-7xl mx-auto">
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase mb-2">
              Vijesti i savjeti
            </p>
            <h1 className="text-4xl md:text-5xl font-black">Blog</h1>
            <p className="text-white/55 mt-2">
              Najnovije vijesti, operacije i obavijesti iz Del Auto.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-12">
          {combined.length === 0 ? (
            <div className="text-center py-24 text-muted-foreground">
              <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p className="font-medium">Nema objavljenih vijesti.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {combined.map((item) => (
                <Link key={`${item.badge}-${item.id}`} href={item.href} className="group">
                  <div className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-md hover:border-primary/30 transition-all h-full flex flex-col">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-44 bg-secondary flex items-center justify-center">
                        <Newspaper className="w-10 h-10 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-xs font-bold px-2 py-0.5 rounded-full"
                          style={{
                            background: item.badge === "Operacija" ? "rgba(66,196,236,0.12)" : "rgba(255,255,255,0.06)",
                            color: item.badge === "Operacija" ? "#42C4EC" : "#6B7280",
                          }}
                        >
                          {item.badge}
                        </span>
                        {item.category && (
                          <p className="text-xs font-bold text-primary uppercase tracking-wider">
                            {item.category}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground ml-auto">
                          {format(new Date(item.published_at), "dd.MM.yyyy")}
                        </p>
                      </div>
                      <h3 className="font-bold text-foreground mb-2 line-clamp-2 leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 flex-1 leading-relaxed">
                        {item.excerpt}
                      </p>
                      <p className="text-xs font-bold text-primary mt-3">Čitaj više →</p>
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
