import { addMinutes, differenceInMinutes, isSameDay, parseISO, format } from "date-fns";
import type { Appointment, ScheduleBlock, Settings, Status } from "./types";

/**
 * Transiciones permitidas. Confirmado → Cancelado se admite porque un paciente
 * puede cancelar un turno confirmado administrativamente antes de llegar.
 */
export const TRANSITIONS: Record<Status, Status[]> = {
  Disponible: ["Reservado"],
  Reservado: ["Confirmado", "Cancelado"],
  Confirmado: ["Atendido", "Ausente", "Cancelado"],
  Atendido: [],
  Cancelado: [],
  Ausente: [],
};

export function canTransition(from: Status, to: Status) {
  return TRANSITIONS[from].includes(to);
}

/** Estados que ocupan una franja horaria. */
export function isActive(a: Appointment) {
  return a.status !== "Cancelado";
}

export function toMinutes(hhmm: string) {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function overlaps(aStart: Date, aDur: number, bStart: Date, bDur: number) {
  const a0 = aStart.getTime();
  const b0 = bStart.getTime();
  return a0 < b0 + bDur * 60000 && b0 < a0 + aDur * 60000;
}

export function blockAppliesOn(b: ScheduleBlock, date: Date) {
  if (b.weekday !== date.getDay()) return false;
  if (format(date, "yyyy-MM-dd") < b.startDate) return false;
  if (b.repeat === "mensual") {
    // primera ocurrencia del mes para ese día de la semana
    return date.getDate() <= 7;
  }
  return true;
}

/** Genera las franjas (inicio) de un bloque para una fecha dada. */
export function blockSlots(b: Pick<ScheduleBlock, "start" | "end" | "duration" | "gap">, date: Date) {
  const res: Date[] = [];
  const end = toMinutes(b.end);
  const base = new Date(date);
  base.setHours(0, 0, 0, 0);
  for (let t = toMinutes(b.start); t + b.duration <= end; t += b.duration + b.gap) {
    res.push(addMinutes(base, t));
  }
  return res;
}

export type SlotState = "libre" | "ocupado" | "pasado";

export function slotState(
  appointments: Appointment[],
  doctorId: string,
  start: Date,
  duration: number,
  now: Date,
): SlotState {
  if (start.getTime() <= now.getTime()) return "pasado";
  const taken = appointments.some(
    (a) => a.doctorId === doctorId && isActive(a) && overlaps(parseISO(a.start), a.duration, start, duration),
  );
  return taken ? "ocupado" : "libre";
}

export function patientHasConflict(
  appointments: Appointment[],
  patientId: string,
  start: Date,
  duration: number,
) {
  return appointments.some(
    (a) => a.patientId === patientId && isActive(a) && overlaps(parseISO(a.start), a.duration, start, duration),
  );
}

/** Ausentes / (atendidos + ausentes). Excluye cancelados y turnos futuros. */
export function absenteeismRate(appts: Appointment[]) {
  const due = appts.filter((a) => a.status === "Atendido" || a.status === "Ausente");
  if (!due.length) return 0;
  return due.filter((a) => a.status === "Ausente").length / due.length;
}

/** Minutos entre llegada e inicio de atención, solo cuando existen ambos. */
export function averageWait(appts: Appointment[]) {
  const w = appts
    .filter((a) => a.arrivedAt && a.startedAt)
    .map((a) => differenceInMinutes(parseISO(a.startedAt!), parseISO(a.arrivedAt!)));
  if (!w.length) return 0;
  return Math.round(w.reduce((s, x) => s + x, 0) / w.length);
}

export type WaitLevel = "normal" | "moderada" | "prolongada";
export function waitLevel(minutes: number, s: Pick<Settings, "waitModerate" | "waitHigh">): WaitLevel {
  if (minutes >= s.waitHigh) return "prolongada";
  if (minutes >= s.waitModerate) return "moderada";
  return "normal";
}

export type CheckInResult =
  | { ok: true }
  | { ok: false; kind: "cancelado" | "atendido" | "ausente" | "otra-fecha" | "ya-registrado"; message: string };

export function checkInEligibility(a: Appointment, now: Date): CheckInResult {
  if (a.status === "Cancelado")
    return { ok: false, kind: "cancelado", message: "El turno fue cancelado. No se puede registrar la llegada." };
  if (a.status === "Atendido")
    return { ok: false, kind: "atendido", message: "El turno ya figura como atendido." };
  if (a.status === "Ausente")
    return {
      ok: false,
      kind: "ausente",
      message: "El turno fue marcado como ausente. No se reactiva automáticamente.",
    };
  if (!isSameDay(parseISO(a.start), now))
    return { ok: false, kind: "otra-fecha", message: "El turno no corresponde a la fecha de trabajo actual." };
  if (a.arrivedAt)
    return { ok: false, kind: "ya-registrado", message: "La llegada ya estaba registrada. No se duplica en la cola." };
  return { ok: true };
}

/** Valida un nuevo bloque de agenda contra los existentes del mismo médico. */
export function validateBlock(block: ScheduleBlock, existing: ScheduleBlock[]): string | null {
  if (toMinutes(block.end) <= toMinutes(block.start)) return "La hora de finalización debe ser posterior al inicio.";
  if (block.duration < 5) return "La duración mínima es de 5 minutos.";
  if (toMinutes(block.end) - toMinutes(block.start) < block.duration)
    return "El bloque no alcanza para un turno completo.";
  const clash = existing.some(
    (e) =>
      e.id !== block.id &&
      e.doctorId === block.doctorId &&
      e.weekday === block.weekday &&
      toMinutes(e.start) < toMinutes(block.end) &&
      toMinutes(block.start) < toMinutes(e.end),
  );
  return clash ? "El bloque se superpone con otro bloque del mismo profesional." : null;
}

/** El paciente puede cancelar solo turnos activos y con la anticipación mínima configurada. */
export function canPatientCancel(a: Appointment, now: Date, cancelMinHours: number): { ok: boolean; reason?: string } {
  if (a.status !== "Reservado" && a.status !== "Confirmado") return { ok: false, reason: "El turno ya no está activo." };
  if (a.arrivedAt) return { ok: false, reason: "La llegada ya fue registrada." };
  const hours = (parseISO(a.start).getTime() - now.getTime()) / 3600000;
  if (hours < cancelMinHours)
    return { ok: false, reason: `Solo se puede cancelar con al menos ${cancelMinHours} h de anticipación. Comunicate con recepción.` };
  return { ok: true };
}
