import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/public/navbar";
import Footer from "@/components/public/footer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function OperationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: op } = await supabase
    .from("operations")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!op) notFound();

  const images: string[] = op.images ?? [];
  const hasHtml = op.content?.includes("<");

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Page header */}
        <div className="bg-navy text-white py-14 px-4">
          <div className="max-w-3xl mx-auto">
            <Link
              href="/operacije"
              className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Nazad na operacije
            </Link>
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase mb-2">
              Usluga
            </p>
            <h1 className="text-3xl md:text-4xl font-black mb-3 leading-tight">{op.title}</h1>
            {op.description && (
              <p className="text-white/55 text-lg leading-relaxed">{op.description}</p>
            )}
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-12">

          {/* Main image */}
          {images[0] && (
            <img
              src={images[0]}
              alt={op.title}
              className="w-full aspect-video object-cover rounded-2xl mb-8 border border-border"
            />
          )}

          {/* Content */}
          {op.content && (
            <div className="mb-10">
              {hasHtml ? (
                <div
                  className="prose prose-invert max-w-none text-muted-foreground leading-relaxed
                    prose-headings:text-foreground prose-headings:font-bold
                    prose-a:text-primary prose-strong:text-foreground"
                  dangerouslySetInnerHTML={{ __html: op.content }}
                />
              ) : (
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  {op.content.split("\n\n").filter(Boolean).map((para: string, i: number) => (
                    <p key={i} className="whitespace-pre-line">{para}</p>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Extra images gallery */}
          {images.length > 1 && (
            <div className="mt-8 mb-10">
              <h2 className="text-lg font-bold text-foreground mb-4">Galerija</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {images.slice(1).map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt={`${op.title} — slika ${i + 2}`}
                    className="w-full aspect-video object-cover rounded-xl border border-border hover:opacity-90 transition-opacity"
                  />
                ))}
              </div>
            </div>
          )}

          <div className="pt-8 border-t border-border flex flex-wrap gap-3 items-center justify-between">
            <Link
              href="/operacije"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:opacity-75 transition-opacity"
            >
              <ArrowLeft className="w-4 h-4" /> Sve operacije
            </Link>
            <Link
              href="/kontakt"
              className="inline-flex items-center px-6 py-3 rounded-full text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
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
