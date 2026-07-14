import Link from "next/link";
import type { Vehicle } from "@/types/database";
import { Fuel, Gauge, Calendar, Settings2, Car } from "lucide-react";
import PriceTag from "@/components/public/price-tag";

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
  const isSold = v.status === "sold";

  return (
    <div
      className={`rounded-2xl shadow-sm border overflow-hidden transition-all duration-300 group flex flex-col ${
        isSold
          ? "border-border/40 bg-card/60 opacity-75 hover:opacity-90"
          : "border-border bg-card hover:shadow-md"
      }`}
    >
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-secondary shrink-0">
        {v.images?.[0] ? (
          <img
            src={v.images[0]}
            alt={`${v.brand} ${v.model}`}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isSold ? "grayscale" : "group-hover:scale-105"
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Car className="w-14 h-14 text-muted-foreground/20" />
          </div>
        )}

        {/* Sold stamp */}
        {isSold && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="text-white font-black text-lg tracking-[0.25em] px-5 py-2 rounded border-2 border-white/70 rotate-[-10deg] select-none">
              PRODANO
            </span>
          </div>
        )}

        {/* Badge (top-left) for non-sold */}
        {!isSold && badge && (
          <span
            className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: badgeBg, color: badgeText }}
          >
            {badge}
          </span>
        )}

        {/* Reserved badge */}
        {v.status === "reserved" && (
          <span className="absolute top-3 right-3 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-400 text-amber-900">
            Rezervisano
          </span>
        )}

        {/* Service sale banner */}
        {v.is_service_sale && !isSold && (
          <div className="absolute bottom-0 left-0 right-0 bg-violet-700/90 text-white text-[11px] font-bold text-center py-1 tracking-wider">
            Uslužna prodaja
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <p className={`text-xs font-semibold uppercase tracking-widest mb-0.5 ${isSold ? "text-muted-foreground/50" : "text-muted-foreground"}`}>
          {v.brand}
        </p>
        <h3 className={`font-bold mb-1 leading-snug ${isSold ? "text-muted-foreground" : "text-foreground"}`}>
          {v.model}{v.engine_size ? ` ${v.engine_size}` : ""}
        </h3>

        {/* Price — hidden for sold */}
        {!isSold && (
          <div className="mb-3">
            <PriceTag
              price={v.price}
              discountPrice={v.discount_price}
              currency={v.currency}
              className="text-2xl font-black text-primary"
            />
          </div>
        )}
        {isSold && <div className="mb-3" />}

        {/* Specs grid */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mb-4">
          {[
            { icon: Calendar, value: String(v.year) },
            { icon: Gauge, value: `${v.mileage.toLocaleString("de-DE")} km` },
            { icon: Fuel, value: FUEL_LABELS[v.fuel_type] ?? v.fuel_type },
            { icon: Settings2, value: TRANS_LABELS[v.transmission] ?? v.transmission },
          ].map(({ icon: Icon, value }) => (
            <div key={value} className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{value}</span>
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-2 mt-auto">
          {isSold ? (
            <Link
              href={`/vozila/${v.id}`}
              className="flex-1 py-2.5 text-sm font-semibold text-center rounded-xl border border-border/50 text-muted-foreground hover:bg-secondary/50 transition-colors"
            >
              Pogledaj detalje
            </Link>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
