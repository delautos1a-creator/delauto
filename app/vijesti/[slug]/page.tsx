import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/public/navbar";
import Footer from "@/components/public/footer";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { format } from "date-fns";

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: n } = await supabase
    .from("news")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!n) notFound();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Page header */}
        <div className="bg-navy text-white py-14 px-4">
          <div className="max-w-3xl mx-auto">
            <Link
              href="/vijesti"
              className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Nazad na blog
            </Link>
            {n.category && (
              <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase mb-2">
                {n.category}
              </p>
            )}
            <h1 className="text-3xl md:text-4xl font-black mb-4 leading-tight">{n.title}</h1>
            <div className="flex items-center gap-2 text-sm text-white/50">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(n.published_at), "dd.MM.yyyy")}</span>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-12">
          {n.featured_image && (
            <img
              src={n.featured_image}
              alt={n.title}
              className="w-full aspect-video object-cover rounded-2xl mb-10 border border-border"
            />
          )}

          {n.excerpt && (
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed font-medium border-l-2 border-primary pl-4">
              {n.excerpt}
            </p>
          )}

          {n.content && (
            <div
              className="prose prose-invert max-w-none text-muted-foreground leading-relaxed
                prose-headings:text-foreground prose-headings:font-bold
                prose-a:text-primary prose-strong:text-foreground"
              dangerouslySetInnerHTML={{ __html: n.content }}
            />
          )}

          <div className="mt-12 pt-8 border-t border-border">
            <Link
              href="/vijesti"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:opacity-75 transition-opacity"
            >
              <ArrowLeft className="w-4 h-4" /> Sve vijesti
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
