"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Car, MessageSquare, Calendar, CheckCircle2,
  Clock, TrendingUp, ArrowRight,
} from "lucide-react";

interface Stats {
  totalVehicles: number;
  availableVehicles: number;
  reservedVehicles: number;
  soldVehicles: number;
  upcomingVehicles: number;
  newInquiries: number;
  newBookings: number;
}

function StatCard({
  label, value, icon: Icon, color, link,
}: {
  label: string;
  value: number | undefined;
  icon: React.ElementType;
  color: string;
  link: string;
}) {
  return (
    <Link href={link}>
      <Card className="border-border hover:border-primary/40 transition-all cursor-pointer">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </div>
          {value === undefined ? (
            <Skeleton className="h-8 w-16 mb-1" />
          ) : (
            <div className="text-3xl font-black">{value}</div>
          )}
          <div className="text-sm text-muted-foreground">{label}</div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Partial<Stats>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const [
        { count: total },
        { count: available },
        { count: reserved },
        { count: sold },
        { count: upcoming },
        { count: newInq },
        { count: newBook },
      ] = await Promise.all([
        supabase.from("vehicles").select("*", { count: "exact", head: true }),
        supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "available"),
        supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "reserved"),
        supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "sold"),
        supabase.from("vehicles").select("*", { count: "exact", head: true }).eq("status", "upcoming"),
        supabase.from("inquiries").select("*", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "new"),
      ]);
      setStats({
        totalVehicles: total ?? 0,
        availableVehicles: available ?? 0,
        reservedVehicles: reserved ?? 0,
        soldVehicles: sold ?? 0,
        upcomingVehicles: upcoming ?? 0,
        newInquiries: newInq ?? 0,
        newBookings: newBook ?? 0,
      });
      setLoading(false);
    };
    load();
  }, []);

  const v = loading ? undefined : stats;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Pregled aktuelnog stanja</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Sva vozila" value={v?.totalVehicles} icon={Car} color="bg-primary/10 text-primary" link="/admin/vozila" />
        <StatCard label="Dostupna" value={v?.availableVehicles} icon={CheckCircle2} color="bg-green-500/10 text-green-400" link="/admin/vozila" />
        <StatCard label="Rezervisana" value={v?.reservedVehicles} icon={Clock} color="bg-yellow-500/10 text-yellow-400" link="/admin/vozila" />
        <StatCard label="Prodana" value={v?.soldVehicles} icon={TrendingUp} color="bg-blue-500/10 text-blue-400" link="/admin/vozila" />
        <StatCard label="Uskoro" value={v?.upcomingVehicles} icon={Car} color="bg-purple-500/10 text-purple-400" link="/admin/vozila" />
        <StatCard label="Novi upiti" value={v?.newInquiries} icon={MessageSquare} color="bg-red-500/10 text-red-400" link="/admin/upiti" />
        <StatCard label="Nova buk." value={v?.newBookings} icon={Calendar} color="bg-orange-500/10 text-orange-400" link="/admin/rezervacije" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border">
          <CardContent className="p-5">
            <h2 className="font-bold mb-4">Brze akcije</h2>
            <div className="space-y-2">
              {[
                { label: "Dodaj novo vozilo", href: "/admin/vozila", highlight: true },
                { label: "Nova operacija", href: "/admin/operacije" },
                { label: "Nova vijest", href: "/admin/vijesti" },
                { label: "Pregled upita", href: "/admin/upiti" },
                { label: "Pregled rezervacija", href: "/admin/rezervacije" },
              ].map(({ label, href, highlight }) => (
                <Link
                  key={href}
                  href={href}
                  className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    highlight
                      ? "bg-primary text-primary-foreground hover:opacity-90"
                      : "bg-secondary text-foreground hover:bg-secondary/80"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-5">
            <h2 className="font-bold mb-4">Pregled po sekcijama</h2>
            <div className="space-y-2">
              {[
                { label: "Vozila", href: "/admin/vozila" },
                { label: "Vijesti", href: "/admin/vijesti" },
                { label: "Recenzije", href: "/admin/recenzije" },
                { label: "Partneri", href: "/admin/partneri" },
                { label: "Postavke", href: "/admin/postavke" },
              ].map(({ label, href }) => (
                <Link
                  key={href}
                  href={href}
                  className="block px-4 py-2.5 rounded-lg text-sm font-medium bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
                >
                  {label}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
