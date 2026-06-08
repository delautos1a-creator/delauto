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
            <h1 className="text-4xl md:text-5xl font-black">{op.title}</h1>
            {op.description && (
              <p className="text-white/55 mt-3 text-lg leading-relaxed">{op.description}</p>
            )}
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-12">
          {op.images?.[0] && (
            <img
              src={op.images[0]}
              alt={op.title}
              className="w-full aspect-video object-cover rounded-2xl mb-10 border border-border"
            />
          )}

          {op.content && (
            <div
              className="prose prose-invert max-w-none text-muted-foreground leading-relaxed
                prose-headings:text-foreground prose-headings:font-bold
                prose-a:text-primary prose-strong:text-foreground"
              dangerouslySetInnerHTML={{ __html: op.content }}
            />
          )}

          <div className="mt-12 pt-8 border-t border-border">
            <Link
              href="/kontakt"
              className="inline-flex items-center px-7 py-3.5 rounded-full text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Kontaktirajte nas za više informacija
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
