import Navbar from "@/components/public/navbar";
import Footer from "@/components/public/footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = { title: "O nama — Del Auto" };

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10">
          <h1 className="text-4xl font-black mb-4">O nama</h1>
          <p className="text-xl text-muted-foreground">
            Del Auto — vaš pouzdani partner za uvoz i prodaju premium vozila iz Europe.
          </p>
        </div>

        <div className="space-y-8 text-muted-foreground leading-relaxed">
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

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { label: "Godina iskustva", value: "10+" },
            { label: "Zadovoljnih kupaca", value: "500+" },
            { label: "Uvezenih vozila", value: "1000+" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center p-6 bg-card border border-border rounded-xl">
              <p className="text-3xl font-black text-primary mb-1">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <Button asChild size="lg">
            <Link href="/kontakt">Kontaktirajte nas</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}
