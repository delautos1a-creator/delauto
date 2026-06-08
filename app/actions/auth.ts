"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

// In-memory lockout store: IP → { count, lockedUntil }
const attempts = new Map<string, { count: number; lockedUntil: number }>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export async function loginAction(
  _prev: { error: string },
  formData: FormData
): Promise<{ error: string }> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0].trim() ??
    h.get("x-real-ip") ??
    "unknown";

  const now = Date.now();
  const entry = attempts.get(ip);

  // Locked out?
  if (entry && entry.lockedUntil > now) {
    const mins = Math.ceil((entry.lockedUntil - now) / 60_000);
    return { error: `Previše pokušaja prijave. Pokušajte za ${mins} min.` };
  }

  const email = formData.get("email")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  if (!email || !password) return { error: "Sva polja su obavezna." };
  // Basic email shape check — prevents trivial enumeration probing
  if (!email.includes("@")) return { error: "Pogrešan email ili lozinka." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const current = attempts.get(ip) ?? { count: 0, lockedUntil: 0 };
    current.count += 1;
    if (current.count >= MAX_ATTEMPTS) {
      current.lockedUntil = now + LOCKOUT_MS;
      current.count = 0;
      attempts.set(ip, current);
      return { error: `Previše pokušaja prijave. Pokušajte za 15 min.` };
    }
    attempts.set(ip, current);
    const remaining = MAX_ATTEMPTS - current.count;
    return {
      error: `Pogrešan email ili lozinka. Preostalo pokušaja: ${remaining}.`,
    };
  }

  // Success — clear entry and redirect to secret admin path
  attempts.delete(ip);
  redirect("/portal");
}
