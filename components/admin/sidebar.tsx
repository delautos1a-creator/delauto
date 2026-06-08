"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Car, Wrench, Newspaper, Calendar,
  MessageSquare, Star, Handshake, Settings, LogOut, Users, X,
} from "lucide-react";

const NAV = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard, exact: true },
  { label: "Vozila", href: "/admin/vozila", icon: Car },
  { label: "Operacije", href: "/admin/operacije", icon: Wrench },
  { label: "Vijesti", href: "/admin/vijesti", icon: Newspaper },
  { label: "Rezervacije", href: "/admin/rezervacije", icon: Calendar },
  { label: "Upiti", href: "/admin/upiti", icon: MessageSquare },
  { label: "Recenzije", href: "/admin/recenzije", icon: Star },
  { label: "Partneri", href: "/admin/partneri", icon: Handshake },
  { label: "Postavke", href: "/admin/postavke", icon: Settings },
  { label: "Korisnici", href: "/admin/korisnici", icon: Users },
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
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src="/delauto-logo.png"
            alt="Del Auto D.O.O."
            className="h-10 w-auto object-contain brightness-0 invert"
          />
          <div className="text-xs text-muted-foreground leading-none pt-0.5">Admin</div>
        </div>
        {mobile && onClose && (
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        )}
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
