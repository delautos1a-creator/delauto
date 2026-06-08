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
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const {
    vehicle_id,
    vehicle_name,
    customer_name,
    customer_email,
    customer_phone,
    preferred_date,
    preferred_time,
    message,
  } = body as Record<string, unknown>;

  // Type + length validation
  if (
    typeof customer_name !== "string" || !customer_name.trim() ||
    typeof customer_email !== "string" || !customer_email.includes("@") ||
    typeof customer_phone !== "string" || !customer_phone.trim() ||
    typeof preferred_date !== "string" || !preferred_date.trim() ||
    typeof preferred_time !== "string" || !preferred_time.trim()
  ) {
    return NextResponse.json({ error: "Sva obavezna polja moraju biti popunjena." }, { status: 400 });
  }

  if (customer_name.length > 120 || customer_email.length > 200 || customer_phone.length > 30) {
    return NextResponse.json({ error: "Unos je predugi." }, { status: 400 });
  }

  const supabase = await createClient();

  // One active test drive per email address
  const { data: existingByEmail } = await supabase
    .from("bookings")
    .select("id")
    .eq("customer_email", customer_email)
    .in("status", ["new", "confirmed"])
    .maybeSingle();

  if (existingByEmail) {
    return NextResponse.json(
      { error: "Već imate aktivnu rezervaciju test vožnje. Svaka osoba može zakazati jednu test vožnju." },
      { status: 409, headers: { "x-conflict": "email" } }
    );
  }

  // Check slot is still free
  const { data: existingSlot } = await supabase
    .from("bookings")
    .select("id")
    .eq("preferred_date", preferred_date)
    .eq("preferred_time", preferred_time)
    .neq("status", "cancelled")
    .maybeSingle();

  if (existingSlot) {
    return NextResponse.json(
      { error: "Ovaj termin je već rezervisan. Molimo odaberite drugi." },
      { status: 409 }
    );
  }

  // Save booking
  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      type: "test_drive",
      vehicle_id: vehicle_id || null,
      vehicle_name: vehicle_name || null,
      customer_name,
      customer_email,
      customer_phone,
      preferred_date,
      preferred_time,
      message: message || null,
      status: "new",
    } as any)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Greška pri čuvanju rezervacije." }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const adminEmail = process.env.ADMIN_EMAIL ?? "info@delauto.ba";

  // Email admin — new booking notification
  await sendBrevoEmail({
    to: adminEmail,
    subject: `Nova rezervacija test vožnje — ${customer_name}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#111">Nova rezervacija test vožnje 🚗</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#666;width:130px">Ime i prezime</td><td style="padding:8px 0;font-weight:600">${customer_name}</td></tr>
          <tr><td style="padding:8px 0;color:#666">Email</td><td style="padding:8px 0"><a href="mailto:${customer_email}">${customer_email}</a></td></tr>
          <tr><td style="padding:8px 0;color:#666">Telefon</td><td style="padding:8px 0;font-weight:600">${customer_phone}</td></tr>
          ${vehicle_name ? `<tr><td style="padding:8px 0;color:#666">Vozilo</td><td style="padding:8px 0">${vehicle_name}</td></tr>` : ""}
          <tr><td style="padding:8px 0;color:#666">Datum</td><td style="padding:8px 0;font-weight:600">${preferred_date}</td></tr>
          <tr><td style="padding:8px 0;color:#666">Vrijeme</td><td style="padding:8px 0;font-weight:600">${preferred_time}</td></tr>
          ${message ? `<tr><td style="padding:8px 0;color:#666;vertical-align:top">Napomena</td><td style="padding:8px 0">${message}</td></tr>` : ""}
        </table>
        <div style="margin-top:24px">
          <a href="${siteUrl}/portal/rezervacije"
            style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
            Odobri ili odbaci rezervaciju →
          </a>
        </div>
        <p style="color:#999;font-size:12px;margin-top:32px">Del Auto D.O.O. — Admin obavijest</p>
      </div>
    `,
  });

  // Email customer — pending acknowledgment
  await sendBrevoEmail({
    to: customer_email,
    subject: "Zahtjev za test vožnju primljen — Del Auto",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#111">Vaš zahtjev je primljen ⏳</h2>
        <p style="color:#444">Poštovani/a <strong>${customer_name}</strong>,</p>
        <p style="color:#444">
          Primili smo vaš zahtjev za test vožnju. Naš tim će ga pregledati i potvrditi u najkraćem mogućem roku.
          Dobit ćete email čim vaša rezervacija bude odobrena ili odbijena.
        </p>
        <div style="background:#f5f5f5;border-radius:12px;padding:20px;margin:24px 0">
          <h3 style="margin:0 0 12px;color:#111">Detalji zahtjeva</h3>
          ${vehicle_name ? `<p style="margin:6px 0;color:#444"><strong>Vozilo:</strong> ${vehicle_name}</p>` : ""}
          <p style="margin:6px 0;color:#444"><strong>Željeni datum:</strong> ${preferred_date}</p>
          <p style="margin:6px 0;color:#444"><strong>Željeno vrijeme:</strong> ${preferred_time}</p>
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

  return NextResponse.json({ success: true, id: (booking as any)?.id });
}

// Get taken time slots for a date
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (!date) return NextResponse.json({ taken: [] });

  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select("preferred_time")
    .eq("preferred_date", date)
    .neq("status", "cancelled");

  const taken = (data ?? []).map((b: any) => b.preferred_time).filter(Boolean);
  return NextResponse.json({ taken });
}
