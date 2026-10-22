import { addDays, startOfDay } from "date-fns";
import { blockAppliesOn, blockSlots, slotState, type SlotState } from "./rules";
import type { Appointment, ScheduleBlock } from "./types";

export interface Slot {
  start: Date;
  duration: number;
  state: SlotState;
}

/** Franjas de un profesional para una fecha, según sus bloques de agenda. */
export function daySlots(
  appointments: Appointment[],
  schedules: ScheduleBlock[],
  doctorId: string,
  date: Date,
  now: Date,
): Slot[] {
  return schedules
    .filter((b) => b.doctorId === doctorId && blockAppliesOn(b, date))
    .flatMap((b) =>
      blockSlots(b, date).map((start) => ({
        start,
        duration: b.duration,
        state: slotState(appointments, doctorId, start, b.duration, now),
      })),
    )
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** Próximos días (desde hoy) en los que el profesional atiende. */
export function workingDays(schedules: ScheduleBlock[], doctorId: string, now: Date, horizon = 21) {
  const res: Date[] = [];
  for (let i = 0; i < horizon; i++) {
    const d = addDays(startOfDay(now), i);
    if (schedules.some((b) => b.doctorId === doctorId && blockAppliesOn(b, d))) res.push(d);
  }
  return res;
}
