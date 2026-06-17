import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitize, isValidEmail, isValidPhone, isValidName, isValidMessage } from "@/lib/validate";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const { customer_name, customer_email, customer_phone, message, vehicle_name } =
    body as Record<string, unknown>;

  if (typeof customer_name !== "string" || typeof customer_email !== "string" || typeof message !== "string")
    return NextResponse.json({ error: "Nevažeći podaci." }, { status: 400 });

  if (!isValidName(customer_name))
    return NextResponse.json({ error: "Ime nije ispravno." }, { status: 400 });
  if (!isValidEmail(customer_email))
    return NextResponse.json({ error: "Email adresa nije ispravna." }, { status: 400 });
  if (customer_phone && typeof customer_phone === "string" && customer_phone.trim() && !isValidPhone(customer_phone))
    return NextResponse.json({ error: "Broj telefona nije ispravan. Dozvoljeni znakovi: cifre, +, -, razmak." }, { status: 400 });
  if (!isValidMessage(message))
    return NextResponse.json({ error: "Poruka mora imati između 3 i 2000 znakova." }, { status: 400 });

  const supabase = await createClient();
  const { error } = await supabase.from("inquiries").insert({
    customer_name: sanitize(customer_name),
    customer_email: customer_email.trim().toLowerCase(),
    customer_phone: (typeof customer_phone === "string" && customer_phone.trim()) ? sanitize(customer_phone) : null,
    message: sanitize(message),
    vehicle_name: (typeof vehicle_name === "string" && vehicle_name.trim()) ? sanitize(vehicle_name) : null,
    status: "new",
  } as any);

  if (error) return NextResponse.json({ error: "Greška pri čuvanju upita." }, { status: 500 });

  const { error: notifError } = await supabase.from("notifications").insert({
    type: "inquiry",
    title: `Novi upit — ${sanitize(customer_name)}`,
    body: sanitize(message).slice(0, 80),
    link: "/portal/upiti",
  } as any);
  if (notifError) console.error("[inquiries] notification insert error:", JSON.stringify(notifError));

  return NextResponse.json({ success: true });
}
