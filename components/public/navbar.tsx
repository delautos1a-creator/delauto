import { createClient } from "@/lib/supabase/server";
import NavbarClient, { type NavItem } from "./navbar-client";

const STATIC_ITEMS: NavItem[] = [
  { label: "Naslovna", href: "/" },
  { label: "Vozila", href: "/vozila" },
  { label: "O nama", href: "/o-nama" },
  { label: "Kontakt", href: "/kontakt" },
];

export default async function Navbar() {
  const supabase = await createClient();

  const [
    { count: upcomingCount },
    { count: newsCount },
    { count: opsCount },
    { count: servicesCount },
  ] = await Promise.all([
    supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "upcoming"),
    supabase.from("news").select("*", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("operations").select("*", { count: "exact", head: true }).eq("is_published", true),
    supabase.from("services").select("*", { count: "exact", head: true }).eq("is_active", true),
  ]);

  const items: NavItem[] = [
    { label: "Naslovna", href: "/" },
    ...(servicesCount ? [{ label: "Usluge", href: "/usluge" }] : []),
    { label: "Vozila", href: "/vozila" },
    ...(upcomingCount ? [{ label: "Uskoro", href: "/uskoro" }] : []),
    ...((newsCount || opsCount) ? [{ label: "Vijesti", href: "/vijesti" }] : []),
    { label: "O nama", href: "/o-nama" },
    { label: "Kontakt", href: "/kontakt" },
  ];

  return <NavbarClient items={items} />;
}
