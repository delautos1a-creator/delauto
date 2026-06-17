"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Car, Wrench, Newspaper, Calendar,
  MessageSquare, Star, Handshake, Settings, LogOut, Users, X, ConciergeBell,
} from "lucide-react";
import NotificationBell from "./notification-bell";

const NAV = [
  { label: "Dashboard", href: "/portal", icon: LayoutDashboard, exact: true },
  { label: "Vozila", href: "/portal/vozila", icon: Car },
  { label: "Usluge", href: "/portal/usluge", icon: ConciergeBell },
  { label: "Operacije", href: "/portal/operacije", icon: Wrench },
  { label: "Vijesti", href: "/portal/vijesti", icon: Newspaper },
  { label: "Rezervacije", href: "/portal/rezervacije", icon: Calendar },
  { label: "Upiti", href: "/portal/upiti", icon: MessageSquare },
  { label: "Recenzije", href: "/portal/recenzije", icon: Star },
  { label: "Partneri", href: "/portal/partneri", icon: Handshake },
  { label: "Postavke", href: "/portal/postavke", icon: Settings },
  { label: "Korisnici", href: "/portal/korisnici", icon: Users },
];

interface Props {
  mobile?: boolean;
  onClose?: () => void;
  userEmail?: string | null;
}

export default function AdminSidebar({ mobile, onClose, userEmail }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className={cn("flex flex-col h-full bg-card border-r border-border", mobile ? "w-full" : "w-64")}>
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between gap-2">
        <img
          src="/delauto-logo.png"
          alt="Del Auto D.O.O."
          className="h-9 w-auto object-contain brightness-0 invert shrink-0"
        />
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Profile avatar */}
          <div className="w-8 h-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0 uppercase">
            {userEmail ? userEmail[0] : "A"}
          </div>
          <NotificationBell align="left" />
          {mobile && onClose && (
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground ml-1">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {NAV.map(({ label, href, icon: Icon, exact }) => (
          <Link
            key={href}
            href={href}
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive(href, exact)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        {userEmail && (
          <p className="text-xs text-muted-foreground px-3 mb-2 truncate">{userEmail}</p>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Odjava
        </button>
      </div>
    </div>
  );
}
