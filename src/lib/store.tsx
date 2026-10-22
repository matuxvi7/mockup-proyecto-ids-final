import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { addMinutes, formatISO, parseISO } from "date-fns";
import * as seed from "./mock-data";
import { canTransition, patientHasConflict, slotState } from "./rules";
import type {
  Appointment,
  AppNotification,
  Doctor,
  Insurance,
  Patient,
  Role,
  Room,
  ScheduleBlock,
  Settings,
  Specialty,
  Status,
} from "./types";

interface Data {
  role: Role;
  specialties: Specialty[];
  doctors: Doctor[];
  rooms: Room[];
  insurances: Insurance[];
  patients: Patient[];
  schedules: ScheduleBlock[];
  appointments: Appointment[];
  settings: Settings;
  notifications: AppNotification[];
  seq: number;
}

const KEY = "si-demo-v1";

function initial(): Data {
  const appointments = seed.seedAppointments();
  return {
    role: "paciente",
    specialties: seed.specialties,
    doctors: seed.doctors,
    rooms: seed.rooms,
    insurances: seed.insurances,
    patients: seed.patients,
    schedules: seed.schedules,
    appointments,
    settings: seed.defaultSettings,
    notifications: seed.seedNotifications(),
    seq: 30001,
  };
}

type Collection = "specialties" | "doctors" | "rooms" | "insurances" | "patients" | "schedules";
type Result = { ok: true; id?: string } | { ok: false; error: string };

function useStoreValue() {
  const [data, setData] = useState<Data>(initial);
  const [hydrated, setHydrated] = useState(false);
  const now = useMemo(() => seed.workingNow(), []);
  const booking = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Data & { day?: string };
        // Datos generados para otra fecha de trabajo: se regeneran
        if (saved.day === now.toDateString()) setData(saved);
      }
    } catch {
      /* datos ficticios: si fallan, se usan los iniciales */
    }
    setHydrated(true);
  }, [now]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(KEY, JSON.stringify({ ...data, day: now.toDateString() }));
  }, [data, hydrated, now]);

  const notify = useCallback((title: string, body: string, audience: AppNotification["audience"]) => {
    setData((d) => ({
      ...d,
      notifications: [
        { id: crypto.randomUUID(), title, body, at: new Date().toISOString(), read: false, audience },
        ...d.notifications,
      ].slice(0, 30),
    }));
  }, []);

  const bookAppointment = useCallback(
    (input: { patientId: string; doctorId: string; start: Date; insuranceId: string }): Result => {
      if (booking.current) return { ok: false, error: "Reserva en curso." };
      const doc = data.doctors.find((d) => d.id === input.doctorId);
      if (!doc) return { ok: false, error: "Profesional inexistente." };
      const sp = data.specialties.find((s) => s.id === doc.specialtyId)!;
      const block = data.schedules.find(
        (b) => b.doctorId === doc.id && b.weekday === input.start.getDay(),
      );
      const duration = block?.duration ?? sp.duration;
      if (slotState(data.appointments, doc.id, input.start, duration, now) !== "libre")
        return { ok: false, error: "El horario ya no está disponible." };
      if (patientHasConflict(data.appointments, input.patientId, input.start, duration))
        return { ok: false, error: "El paciente ya tiene un turno activo en ese horario." };
      booking.current = true;
      const id = `SI-${data.seq}`;
      const appt: Appointment = {
        id,
        patientId: input.patientId,
        doctorId: doc.id,
        specialtyId: doc.specialtyId,
        roomId: doc.roomId,
        insuranceId: input.insuranceId,
        start: formatISO(input.start),
        duration,
        status: "Reservado",
        createdAt: new Date().toISOString(),
      };
      setData((d) => ({ ...d, seq: d.seq + 1, appointments: [...d.appointments, appt] }));
      setTimeout(() => (booking.current = false), 300);
      return { ok: true, id };
    },
    [data, now],
  );

  const setStatus = useCallback(
    (id: string, to: Status, reason?: string): Result => {
      const a = data.appointments.find((x) => x.id === id);
      if (!a) return { ok: false, error: "Turno inexistente." };
      if (!canTransition(a.status, to))
        return { ok: false, error: `No se puede pasar de ${a.status} a ${to}.` };
      setData((d) => ({
        ...d,
        appointments: d.appointments.map((x) => {
          if (x.id !== id) return x;
          const next: Appointment = { ...x, status: to as Appointment["status"] };
          if (to === "Cancelado") next.cancellationReason = reason ?? "Cancelado";
          if (to === "Atendido" && !next.startedAt) next.startedAt = formatISO(now);
          return next;
        }),
      }));
      return { ok: true };
    },
    [data.appointments, now],
  );

  const checkIn = useCallback(
    (id: string): Result => {
      const a = data.appointments.find((x) => x.id === id);
      if (!a) return { ok: false, error: "Turno inexistente." };
      const arrivals = data.appointments.filter((x) => x.arrivedAt).map((x) => parseISO(x.arrivedAt!).getTime());
      const latest = Math.max(now.getTime(), ...arrivals.filter((t) => t <= now.getTime() + 3600000));
      const arrivedAt = formatISO(latest > now.getTime() ? addMinutes(new Date(latest), 1) : now);
      setData((d) => ({
        ...d,
        appointments: d.appointments.map((x) =>
          x.id === id ? { ...x, status: "Confirmado", arrivedAt } : x,
        ),
      }));
      return { ok: true };
    },
    [data.appointments, now],
  );

  const startConsult = useCallback(
    (id: string) =>
      setData((d) => ({
        ...d,
        appointments: d.appointments.map((x) => (x.id === id ? { ...x, startedAt: formatISO(now) } : x)),
      })),
    [now],
  );

  const revertAbsent = useCallback(
    (id: string) =>
      setData((d) => ({
        ...d,
        appointments: d.appointments.map((x) =>
          x.id === id && x.status === "Ausente" ? { ...x, status: "Confirmado" } : x,
        ),
      })),
    [],
  );

  function upsert<C extends Collection>(col: C, item: Data[C][number]) {
    setData((d) => {
      const list = d[col] as { id: string }[];
      const exists = list.some((x) => x.id === item.id);
      return {
        ...d,
        [col]: exists ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item],
      };
    });
  }
  function remove(col: Collection, id: string) {
    setData((d) => ({ ...d, [col]: (d[col] as { id: string }[]).filter((x) => x.id !== id) }));
  }

  return {
    ...data,
    hydrated,
    now,
    setRole: (role: Role) => setData((d) => ({ ...d, role })),
    bookAppointment,
    setStatus,
    checkIn,
    startConsult,
    revertAbsent,
    upsert,
    remove,
    notify,
    markNotificationsRead: (aud: AppNotification["audience"]) =>
      setData((d) => ({
        ...d,
        notifications: d.notifications.map((n) => (n.audience === aud ? { ...n, read: true } : n)),
      })),
    updateSettings: (s: Settings) => setData((d) => ({ ...d, settings: s })),
    resetDemo: () => setData(initial()),
  };
}

export type Store = ReturnType<typeof useStoreValue>;
const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue();
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore fuera de StoreProvider");
  return v;
}

/** Ayudantes de lectura */
export function useLookup() {
  const s = useStore();
  return useMemo(() => {
    const m = <T extends { id: string }>(l: T[]) => new Map(l.map((x) => [x.id, x]));
    const doctors = m(s.doctors);
    const specialties = m(s.specialties);
    const rooms = m(s.rooms);
    const insurances = m(s.insurances);
    const patients = m(s.patients);
    return {
      doctor: (id: string) => doctors.get(id),
      doctorName: (id: string) => {
        const d = doctors.get(id);
        return d ? `${d.title} ${d.firstName} ${d.lastName}` : "—";
      },
      specialty: (id: string) => specialties.get(id),
      specialtyName: (id: string) => specialties.get(id)?.name ?? "—",
      room: (id: string) => rooms.get(id),
      roomName: (id: string) => rooms.get(id)?.code ?? "—",
      insuranceName: (id: string) => insurances.get(id)?.name ?? "—",
      patient: (id: string) => patients.get(id),
      patientName: (id: string) => {
        const p = patients.get(id);
        return p ? `${p.firstName} ${p.lastName}` : "—";
      },
    };
  }, [s.doctors, s.specialties, s.rooms, s.insurances, s.patients]);
}
