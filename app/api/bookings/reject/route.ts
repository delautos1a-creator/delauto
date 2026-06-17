import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  const { booking_id } = body as { booking_id?: string };
  if (!booking_id || typeof booking_id !== "string") return NextResponse.json({ error: "Missing booking_id" }, { status: 400 });

  const { data: booking, error } = await supabase.from("bookings").select("id").eq("id", booking_id).single();
  if (error || !booking) return NextResponse.json({ error: "Rezervacija nije pronađena." }, { status: 404 });

  await supabase.from("bookings").update({ status: "cancelled" } as any).eq("id", booking_id);

  return NextResponse.json({ success: true });
}
