import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const body = await request.json();
  const {
    vehicle_id,
    vehicle_name,
    customer_name,
    customer_email,
    customer_phone,
    preferred_date,
    preferred_time,
    message,
  } = body;

  // Validate required fields
  if (!customer_name || !customer_email || !customer_phone || !preferred_date || !preferred_time) {
    return NextResponse.json({ error: "Sva obavezna polja moraju biti popunjena." }, { status: 400 });
  }

  const supabase = await createClient();

  // Check slot is still free
  const { data: existing } = await supabase
    .from("bookings")
    .select("id")
    .eq("preferred_date", preferred_date)
    .eq("preferred_time", preferred_time)
    .neq("status", "cancelled")
    .single();

  if (existing) {
    return NextResponse.json({ error: "Ovaj termin je već rezervisan. Molimo odaberite drugi." }, { status: 409 });
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

  // Email admin
  await resend.emails.send({
    from: "Del Auto <onboarding@resend.dev>",
    to: adminEmail,
    subject: `Nova rezervacija test vožnje — ${customer_name}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#111">Nova rezervacija test vožnje</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 0;color:#666">Ime i prezime</td><td style="padding:8px 0;font-weight:600">${customer_name}</td></tr>
          <tr><td style="padding:8px 0;color:#666">Email</td><td style="padding:8px 0"><a href="mailto:${customer_email}">${customer_email}</a></td></tr>
          <tr><td style="padding:8px 0;color:#666">Telefon</td><td style="padding:8px 0;font-weight:600">${customer_phone}</td></tr>
          ${vehicle_name ? `<tr><td style="padding:8px 0;color:#666">Vozilo</td><td style="padding:8px 0">${vehicle_name}</td></tr>` : ""}
          <tr><td style="padding:8px 0;color:#666">Datum</td><td style="padding:8px 0;font-weight:600">${preferred_date}</td></tr>
          <tr><td style="padding:8px 0;color:#666">Vrijeme</td><td style="padding:8px 0;font-weight:600">${preferred_time}</td></tr>
          ${message ? `<tr><td style="padding:8px 0;color:#666;vertical-align:top">Poruka</td><td style="padding:8px 0">${message}</td></tr>` : ""}
        </table>
        <div style="margin-top:24px">
          <a href="${siteUrl}/admin/rezervacije" style="background:#111;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
            Odobri ili odbaci rezervaciju →
          </a>
        </div>
        <p style="color:#999;font-size:12px;margin-top:24px">Del Auto Admin Panel</p>
      </div>
    `,
  });

  return NextResponse.json({ success: true, id: (booking as any)?.id });
}

// Check taken slots for a specific date
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
