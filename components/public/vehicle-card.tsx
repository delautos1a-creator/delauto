import Link from "next/link";
import type { Vehicle } from "@/types/database";
import { Fuel, Gauge, Calendar, Settings2, Car } from "lucide-react";

const FUEL_LABELS: Record<string, string> = {
  petrol: "Benzin",
  diesel: "Diesel",
  electric: "Električno",
  hybrid: "Hibrid",
  lpg: "LPG",
};

const TRANS_LABELS: Record<string, string> = {
  manual: "Manuelni",
  automatic: "Automatski",
};

interface Props {
  vehicle: Vehicle;
  badge?: string;
  badgeBg?: string;
  badgeText?: string;
}

export default function VehicleCard({
  vehicle: v,
  badge,
  badgeBg = "#42C4EC",
  badgeText = "#08152B",
}: Props) {
  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-all duration-300 group flex flex-col">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-secondary shrink-0">
        {v.images?.[0] ? (
          <img
            src={v.images[0]}
            alt={`${v.brand} ${v.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car className="w-14 h-14 text-muted-foreground/20" />
          </div>
        )}

        {/* Badge */}
        {badge && (
          <span
            className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: badgeBg, color: badgeText }}
          >
            {badge}
          </span>
        )}

        {/* Reserved overlay */}
        {v.status === "reserved" && (
          <span className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-400 text-amber-900">
            Rezervisano
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">
          {v.brand}
        </p>
        <h3 className="font-bold text-foreground mb-1 leading-snug">
          {v.model}{v.engine_size ? ` ${v.engine_size}` : ""}
        </h3>
        <p className="text-2xl font-black mb-3 text-primary">
          {v.price.toLocaleString("de-DE")} {v.currency}
        </p>

        {/* Specs grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-4">
          {[
            { icon: Calendar, value: String(v.year) },
            { icon: Gauge, value: `${v.mileage.toLocaleString("de-DE")} km` },
            { icon: Fuel, value: FUEL_LABELS[v.fuel_type] ?? v.fuel_type },
            { icon: Settings2, value: TRANS_LABELS[v.transmission] ?? v.transmission },
          ].map(({ icon: Icon, value }) => (
            <div key={value} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{value}</span>
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-auto">
          <Link
            href={`/vozila/${v.id}`}
            className="flex-1 py-2.5 text-sm font-semibold text-center rounded-xl border border-border hover:bg-secondary transition-colors text-foreground"
          >
            Detalji
          </Link>
          <Link
            href={`/vozila/${v.id}#test-voznja`}
            className="flex-1 py-2.5 text-sm font-semibold text-center rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Test vožnja
          </Link>
        </div>
      </div>
    </div>
  );
}
