import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitize, isValidName } from "@/lib/validate";

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }

  const { customer_name, rating, text, vehicle_purchased } = body as Record<string, unknown>;

  // Type checks
  if (typeof customer_name !== "string" || typeof text !== "string" || typeof rating !== "number")
    return NextResponse.json({ error: "Nevažeći podaci." }, { status: 400 });

  // Validate name
  if (!isValidName(customer_name))
    return NextResponse.json({ error: "Ime nije ispravno (2–120 znakova)." }, { status: 400 });

  // Validate rating
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    return NextResponse.json({ error: "Ocjena mora biti između 1 i 5." }, { status: 400 });

  // Validate text
  const trimmedText = text.trim();
  if (trimmedText.length < 10)
    return NextResponse.json({ error: "Recenzija mora imati najmanje 10 znakova." }, { status: 400 });
  if (trimmedText.length > 1000)
    return NextResponse.json({ error: "Recenzija ne smije biti duža od 1000 znakova." }, { status: 400 });
  if (/<script/i.test(trimmedText))
    return NextResponse.json({ error: "Nevažeći sadržaj." }, { status: 400 });

  // Validate vehicle (optional)
  const vehicle = typeof vehicle_purchased === "string" && vehicle_purchased.trim()
    ? vehicle_purchased.trim()
    : null;
  if (vehicle && vehicle.length > 100)
    return NextResponse.json({ error: "Naziv vozila je predugačak." }, { status: 400 });

  const supabase = await createClient();

  const { error } = await supabase.from("testimonials").insert({
    customer_name: sanitize(customer_name),
    rating,
    text: sanitize(trimmedText),
    vehicle_purchased: vehicle ? sanitize(vehicle) : null,
    is_approved: false,
    is_featured: false,
    date: new Date().toISOString().split("T")[0],
  } as any);

  if (error) {
    console.error("[testimonials] insert error:", error.message);
    return NextResponse.json({ error: "Greška pri čuvanju recenzije." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
