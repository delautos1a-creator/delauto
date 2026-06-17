"use client";

import { useState } from "react";
import ServiceBookingModal from "./service-booking-modal";
import { CalendarCheck } from "lucide-react";

interface Props {
  serviceId: string;
  serviceName: string;
  scheduleFrom: string | null;
  scheduleTo: string | null;
  timeFrom: string;
  timeTo: string;
  allowWeekdays: boolean;
  allowSaturday: boolean;
  allowSunday: boolean;
}

export default function ServiceBookingButton({ serviceId, serviceName, scheduleFrom, scheduleTo, timeFrom, timeTo, allowWeekdays, allowSaturday, allowSunday }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
      >
        <CalendarCheck className="w-4 h-4" />
        Zakaži termin
      </button>
      <ServiceBookingModal
        open={open}
        onClose={() => setOpen(false)}
        serviceId={serviceId}
        serviceName={serviceName}
        scheduleFrom={scheduleFrom}
        scheduleTo={scheduleTo}
        timeFrom={timeFrom}
        timeTo={timeTo}
        allowWeekdays={allowWeekdays}
        allowSaturday={allowSaturday}
        allowSunday={allowSunday}
      />
    </>
  );
}
