"use client";

import { useState } from "react";
import type { Vehicle } from "@/types/database";
import VehicleCard from "./vehicle-card";

type SortKey = "newest" | "price_asc" | "price_desc" | "mileage_asc";

const TABS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Najnoviji" },
  { key: "price_asc", label: "Najniža cijena" },
  { key: "price_desc", label: "Najviša cijena" },
  { key: "mileage_asc", label: "Najmanje km" },
];

function sort(vehicles: Vehicle[], key: SortKey): Vehicle[] {
  const copy = [...vehicles];
  switch (key) {
    case "newest":
      return copy.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    case "price_asc":
      return copy.sort((a, b) => a.price - b.price);
    case "price_desc":
      return copy.sort((a, b) => b.price - a.price);
    case "mileage_asc":
      return copy.sort((a, b) => a.mileage - b.mileage);
  }
}

const BADGE_MAP: Record<SortKey, { label: string; bg: string; color: string }> = {
  newest: { label: "Najnoviji", bg: "#42C4EC", color: "#08152B" },
  price_asc: { label: "Najpovoljniji", bg: "#22c55e", color: "#fff" },
  price_desc: { label: "Premium", bg: "#a855f7", color: "#fff" },
  mileage_asc: { label: "Najmanje km", bg: "#f59e0b", color: "#08152B" },
};

export default function VehicleTabs({ vehicles }: { vehicles: Vehicle[] }) {
  const [active, setActive] = useState<SortKey>("newest");
  const sorted = sort(vehicles, active);
  const badge = BADGE_MAP[active];

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActive(key)}
            className="px-4 py-2 rounded-full text-sm font-semibold transition-all"
            style={
              active === key
                ? { backgroundColor: "#42C4EC", color: "#08152B" }
                : { backgroundColor: "#131313", color: "#6B7280" }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sorted.map((v, i) => (
          <VehicleCard
            key={v.id}
            vehicle={v}
            badge={i === 0 ? badge.label : v.is_featured ? "Istaknuto" : undefined}
            badgeBg={i === 0 ? badge.bg : "#42C4EC"}
            badgeText={i === 0 ? badge.color : "#08152B"}
          />
        ))}
      </div>
    </div>
  );
}
