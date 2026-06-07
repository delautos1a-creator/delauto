import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/public/navbar";
import Footer from "@/components/public/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black mb-2">Vijesti</h1>
          <p className="text-muted-foreground">Najnovije vijesti i obavijesti.</p>
        </div>
        {!news?.length ? (
          <div className="text-center py-20 text-muted-foreground">
            <Newspaper className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p>Nema objavljenih vijesti.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {news.map((n) => (
              <Link key={n.id} href={`/vijesti/${n.slug}`}>
                <Card className="border-border hover:border-primary/40 transition-all overflow-hidden group h-full">
                  {n.featured_image ? (
                    <img src={n.featured_image} alt={n.title} className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-44 bg-secondary flex items-center justify-center">
                      <Newspaper className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-2">
                      {format(new Date(n.published_at), "dd.MM.yyyy")}
                    </p>
                    <p className="font-bold mb-2 line-clamp-2">{n.title}</p>
                    <p className="text-sm text-muted-foreground line-clamp-3">{n.excerpt}</p>
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
