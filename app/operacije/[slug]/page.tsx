import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/public/navbar";
import Footer from "@/components/public/footer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function OperationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: op } = await supabase.from("operations").select("*").eq("slug", slug).eq("is_published", true).single();

  if (!op) notFound();

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/operacije" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Nazad na operacije
        </Link>
        {op.images?.[0] && (
          <img src={op.images[0]} alt={op.title} className="w-full aspect-video object-cover rounded-xl mb-8" />
        )}
        <h1 className="text-3xl font-black mb-3">{op.title}</h1>
        <p className="text-lg text-muted-foreground mb-8">{op.description}</p>
        <div
          className="prose prose-invert max-w-none text-muted-foreground leading-relaxed"
          dangerouslySetInnerHTML={{ __html: op.content }}
        />
      </main>
      <Footer />
    </>
  );
}
