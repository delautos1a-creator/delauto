"use client";

import { useState, useEffect, useRef, useId } from "react";
import { Bell, Calendar, MessageSquare, Wrench } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type Notification = {
  id: string;
  type: "booking" | "service_booking" | "inquiry";
  title: string;
  body: string | null;
  link: string;
  is_read: boolean;
  created_at: string;
};

const TYPE_ICON = {
  booking: Calendar,
  service_booking: Wrench,
  inquiry: MessageSquare,
};

const TYPE_COLOR = {
  booking: "bg-blue-500/15 text-blue-400",
  service_booking: "bg-amber-500/15 text-amber-400",
  inquiry: "bg-green-500/15 text-green-400",
};

export default function NotificationBell({ align = "right" }: { align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const instanceId = useId();

  const unread = notifications.filter((n) => !n.is_read).length;

  const fetchNotifications = async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) {
      console.error("[bell] fetch error:", error.code, error.message);
      return;
    }
    console.log("[bell] fetched", data?.length, "notifications");
    if (data) setNotifications(data as Notification[]);
  };

  useEffect(() => {
    fetchNotifications();

    const supabase = createClient();
    const channel = supabase
      .channel(`notifications-${instanceId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          setNotifications((prev) =>
            [payload.new as Notification, ...prev].slice(0, 20)
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    const supabase = createClient();
    await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleToggle = () => {
    setOpen((prev) => {
      if (!prev) setTimeout(markAllRead, 1500);
      return !prev;
    });
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        aria-label="Obavještenja"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "absolute top-full mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden",
            align === "left" ? "left-0" : "right-0"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-sm font-semibold">Obavještenja</span>
              {unread > 0 && (
                <span className="text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 font-bold leading-none">
                  {unread} novo
                </span>
              )}
            </div>
            {notifications.some((n) => !n.is_read) && (
              <button onClick={markAllRead} className="text-xs text-primary hover:underline">
                Sve pročitano
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-border/50">
            {notifications.length === 0 ? (
              <div className="text-center py-10">
                <Bell className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Nema obavještenja</p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = TYPE_ICON[n.type] ?? Bell;
                const colorClass = TYPE_COLOR[n.type] ?? "bg-secondary text-muted-foreground";
                return (
                  <Link
                    key={n.id}
                    href={n.link}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-start gap-3 px-4 py-3.5 hover:bg-secondary/60 transition-colors",
                      !n.is_read && "bg-primary/5"
                    )}
                  >
                    {/* Icon bubble */}
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", colorClass)}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm leading-snug", !n.is_read ? "font-semibold text-foreground" : "font-medium text-foreground/80")}>
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0 mt-1.5" />
                        )}
                      </div>
                      {n.body && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{n.body}</p>
                      )}
                      <p className="text-xs text-muted-foreground/50 mt-1">
                        {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
