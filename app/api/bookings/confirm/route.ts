import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { booking_id } = await request.json();
  if (!booking_id) return NextResponse.json({ error: "Missing booking_id" }, { status: 400 });

  const supabase = await createClient();

  // Fetch booking details
  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", booking_id)
    .single();

  if (error || !booking) {
    return NextResponse.json({ error: "Rezervacija nije pronađena." }, { status: 404 });
  }

  const b = booking as any;

  // Send confirmation email to customer
  await resend.emails.send({
    from: "Del Auto <onboarding@resend.dev>",
    to: b.customer_email,
    subject: "Vaša test vožnja je potvrđena! ✅",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#111">Test vožnja potvrđena ✅</h2>
        <p style="color:#444">Poštovani/a <strong>${b.customer_name}</strong>,</p>
        <p style="color:#444">Vaša rezervacija test vožnje je <strong>potvrđena</strong>. Radujemo se vašem dolasku!</p>

        <div style="background:#f5f5f5;border-radius:12px;padding:20px;margin:24px 0">
          <h3 style="margin:0 0 12px;color:#111">Detalji rezervacije</h3>
          ${b.vehicle_name ? `<p style="margin:6px 0;color:#444"><strong>Vozilo:</strong> ${b.vehicle_name}</p>` : ""}
          <p style="margin:6px 0;color:#444"><strong>Datum:</strong> ${b.preferred_date}</p>
          <p style="margin:6px 0;color:#444"><strong>Vrijeme:</strong> ${b.preferred_time}</p>
          <p style="margin:6px 0;color:#444"><strong>Lokacija:</strong> Del Auto, Sarajevo</p>
        </div>

        <p style="color:#444">Ukoliko imate bilo kakvih pitanja, slobodno nas kontaktirajte:</p>
        <p style="color:#444">📞 <a href="tel:+38761000000">+387 61 000 000</a></p>
        <p style="color:#444">✉️ <a href="mailto:info@delauto.ba">info@delauto.ba</a></p>

        <p style="color:#999;font-size:12px;margin-top:32px">
          Del Auto — Premium uvoz vozila, Sarajevo, BiH
        </p>
      </div>
    `,
  });

  return NextResponse.json({ success: true });
}
