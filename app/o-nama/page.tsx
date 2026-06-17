import Link from "next/link";
import Navbar from "@/components/public/navbar";
import Footer from "@/components/public/footer";

export const metadata = { title: "O nama — Del Auto" };

const VALUES = [
  {
    icon: "🔍",
    title: "Transparentnost",
    desc: "Svako vozilo dolazi s kompletnom dokumentacijom i provjerenim servisnim historijatom. Nema skrivenih informacija.",
  },
  {
    icon: "🤝",
    title: "Povjerenje",
    desc: "Izgradili smo odnos povjerenja s kupacima kroz godine dosljedne i poštene usluge.",
  },
  {
    icon: "🚗",
    title: "Kvalitet",
    desc: "Vozila biramo s posebnom pažnjom — samo ona koja zadovoljavaju naše stroge standarde kvaliteta i sigurnosti.",
  },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        {/* Page header */}
        <div className="bg-navy text-white py-14 px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase mb-2">
              Naša priča
            </p>
            <h1 className="text-4xl md:text-5xl font-black mb-3">O nama</h1>
            <p className="text-white/55">
              Pouzdani partner za uvoz i prodaju premium vozila iz Europe.
            </p>
          </div>
        </div>

        {/* Main content */}
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <div>
              <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase mb-3">Ko smo mi</p>
              <h2 className="text-2xl md:text-3xl font-black text-foreground mb-5">
                Del Auto — vaš pouzdani partner
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
                <p>
                  Del Auto je specijalizovana kompanija za uvoz i prodaju premium vozila sa europskog tržišta.
                  Naš tim stručnjaka pruža kompletnu uslugu — od pronalaska vozila prema vašim željama,
                  inspekcije, transporta, carinjenja do finalne isporuke.
                </p>
                <p>
                  Naš prioritet je transparentnost i povjerenje. Svako vozilo prolazi kroz detaljnu inspekciju
                  i pripremu prije isporuke, a klijentima obezbjeđujemo kompletnu dokumentaciju.
                </p>
                <p>
                  Sarađujemo sa provjerenim partnerima iz oblasti bankarstva, leasinga i osiguranja kako bismo
                  vam olakšali finansiranje kupovine.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {VALUES.map(({ icon, title, desc }) => (
                <div key={title} className="bg-card rounded-2xl border border-border p-5 flex gap-4">
                  <span className="text-2xl shrink-0">{icon}</span>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="bg-navy rounded-2xl p-10 text-center text-white">
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase mb-3">Kontakt</p>
            <h2 className="text-2xl font-black mb-3">Spremi za razgovor?</h2>
            <p className="text-white/55 mb-6 text-sm max-w-md mx-auto">
              Naš tim je uvijek dostupan da odgovori na vaša pitanja i pomogne vam pronaći savršeno vozilo.
            </p>
            <Link
              href="/kontakt"
              className="inline-flex items-center px-7 py-3.5 rounded-full text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
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
