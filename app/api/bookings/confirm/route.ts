import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function sendBrevoEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey || apiKey === "your_brevo_api_key_here") return;

  await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: { name: "Del Auto", email: process.env.ADMIN_EMAIL ?? "info@delauto.ba" },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();

  // Must be authenticated admin
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const { booking_id } = body as { booking_id?: string };
  if (!booking_id || typeof booking_id !== "string") return NextResponse.json({ error: "Missing booking_id" }, { status: 400 });

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", booking_id)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: "Rezervacija nije pronađena." }, { status: 404 });
  }

  await supabase.from("bookings").update({ status: "confirmed" } as any).eq("id", booking_id);

  const b = booking as any;

  await sendBrevoEmail({
    to: b.customer_email,
    subject: "Vaša test vožnja je potvrđena! ✅",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <img src="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/delauto-logo.png"
             alt="Del Auto" style="height:60px;margin-bottom:24px" />

        <h2 style="color:#111">Test vožnja potvrđena ✅</h2>
        <p style="color:#444">Poštovani/a <strong>${b.customer_name}</strong>,</p>
        <p style="color:#444">Vaša rezervacija test vožnje je <strong>potvrđena</strong>. Radujemo se vašem dolasku!</p>

        <div style="background:#f5f5f5;border-radius:12px;padding:20px;margin:24px 0">
          <h3 style="margin:0 0 12px;color:#111">Detalji rezervacije</h3>
          ${b.vehicle_name ? `<p style="margin:6px 0;color:#444"><strong>Vozilo:</strong> ${b.vehicle_name}</p>` : ""}
          <p style="margin:6px 0;color:#444"><strong>Datum:</strong> ${b.preferred_date}</p>
          <p style="margin:6px 0;color:#444"><strong>Vrijeme:</strong> ${b.preferred_time}</p>
          <p style="margin:6px 0;color:#444"><strong>Lokacija:</strong> Del Auto D.O.O., Sarajevo</p>
        </div>

        <p style="color:#444">Ukoliko imate pitanja, slobodno nas kontaktirajte:</p>
        <p style="color:#444">📞 <strong>+387 61 000 000</strong></p>
        <p style="color:#444">✉️ info@delauto.ba</p>

        <p style="color:#bbb;font-size:12px;margin-top:32px;border-top:1px solid #eee;padding-top:16px">
          Del Auto D.O.O. — Prodaja automobila, Sarajevo, BiH
        </p>
      </div>
    `,
  });

  return NextResponse.json({ success: true });
}
