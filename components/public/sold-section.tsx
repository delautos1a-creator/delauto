"use client";

import { useState } from "react";
import type { Vehicle } from "@/types/database";
import VehicleCard from "./vehicle-card";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function SoldSection({ vehicles }: { vehicles: Vehicle[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-border/40 bg-secondary/20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-3 group w-full text-left"
        >
          <div className="flex-1">
            <p className="text-xs font-bold tracking-[0.18em] text-muted-foreground uppercase mb-0.5">
              Arhiva
            </p>
            <h2 className="text-xl font-black text-muted-foreground group-hover:text-foreground transition-colors">
              Prodana vozila
              <span className="ml-2 text-sm font-normal text-muted-foreground/60">
                ({vehicles.length})
              </span>
            </h2>
          </div>
          <div className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground group-hover:border-foreground/30 group-hover:text-foreground transition-all shrink-0">
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {open && (
          <div className="mt-8">
            <p className="text-sm text-muted-foreground mb-6">
              Vozila koja su ranije bila u ponudi Del Auta. Kontaktirajte nas za slična dostupna vozila.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {vehicles.map((v) => (
                <VehicleCard key={v.id} vehicle={v} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
