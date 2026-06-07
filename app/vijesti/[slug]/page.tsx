import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Navbar from "@/components/public/navbar";
import Footer from "@/components/public/footer";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

export default async function NewsDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: n } = await supabase.from("news").select("*").eq("slug", slug).eq("is_published", true).single();

  if (!n) notFound();

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/vijesti" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Nazad na vijesti
        </Link>
        {n.featured_image && (
          <img src={n.featured_image} alt={n.title} className="w-full aspect-video object-cover rounded-xl mb-8" />
        )}
        <p className="text-sm text-muted-foreground mb-3">
          {format(new Date(n.published_at), "dd.MM.yyyy")}
        </p>
        <h1 className="text-3xl font-black mb-4">{n.title}</h1>
        <p className="text-lg text-muted-foreground mb-8">{n.excerpt}</p>
        <div
          className="prose prose-invert max-w-none text-muted-foreground leading-relaxed"
          dangerouslySetInnerHTML={{ __html: n.content }}
        />
      </main>
      <Footer />
    </>
  );
}
