import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitize, isValidEmail, isValidPhone, isValidName } from "@/lib/validate";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const { service_id, service_name, customer_name, customer_email, customer_phone, preferred_date, preferred_time, message } =
    body as Record<string, unknown>;

  if (
    typeof customer_name !== "string" || typeof customer_email !== "string" ||
    typeof customer_phone !== "string" || typeof preferred_date !== "string" ||
    typeof preferred_time !== "string"
  ) {
    return NextResponse.json({ error: "Nevažeći podaci." }, { status: 400 });
  }

  if (!isValidName(customer_name))
    return NextResponse.json({ error: "Ime nije ispravno." }, { status: 400 });
  if (!isValidEmail(customer_email))
    return NextResponse.json({ error: "Email adresa nije ispravna." }, { status: 400 });
  if (!isValidPhone(customer_phone))
    return NextResponse.json({ error: "Broj telefona nije ispravan. Dozvoljeni znakovi: cifre, +, -, razmak." }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(preferred_date))
    return NextResponse.json({ error: "Datum nije ispravan." }, { status: 400 });
  if (!/^\d{2}:\d{2}$/.test(preferred_time))
    return NextResponse.json({ error: "Vrijeme nije ispravno." }, { status: 400 });

  const name = sanitize(customer_name);
  const email = customer_email.trim().toLowerCase();
  const phone = sanitize(customer_phone);
  const msg = message && typeof message === "string" ? sanitize(message).slice(0, 2000) : null;

  const supabase = await createClient();

  const { data: existingSlot } = await supabase
    .from("bookings")
    .select("id")
    .eq("preferred_date", preferred_date)
    .eq("preferred_time", preferred_time)
    .neq("status", "cancelled")
    .maybeSingle();

  if (existingSlot)
    return NextResponse.json({ error: "Ovaj termin je već rezervisan. Molimo odaberite drugi." }, { status: 409 });

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      type: "service",
      service_id: service_id || null,
      service_name: typeof service_name === "string" ? sanitize(service_name) : null,
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      preferred_date,
      preferred_time,
      message: msg,
      status: "new",
    } as any)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Greška pri čuvanju rezervacije." }, { status: 500 });

  const { error: notifError } = await supabase.from("notifications").insert({
    type: "service_booking",
    title: `Nova rezervacija usluge — ${service_name}`,
    body: `${name} · ${preferred_date} u ${preferred_time}`,
    link: "/portal/rezervacije",
  } as any);
  if (notifError) console.error("[service-bookings] notification insert error:", JSON.stringify(notifError));

  return NextResponse.json({ success: true, id: (booking as any)?.id });
}
