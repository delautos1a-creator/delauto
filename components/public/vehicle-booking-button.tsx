"use client";

import { useState } from "react";
import BookingModal from "./booking-modal";
import { CalendarCheck } from "lucide-react";

export default function VehicleBookingButton({ vehicleId, vehicleName }: { vehicleId: string; vehicleName: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
      >
        <CalendarCheck className="w-4 h-4" />
        Zakaži test vožnju
      </button>
      <BookingModal open={open} onClose={() => setOpen(false)} vehicleId={vehicleId} vehicleName={vehicleName} />
    </>
  );
}
