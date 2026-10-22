import { addDays, addMinutes, formatISO, startOfDay } from "date-fns";
import type {
  Appointment,
  AppNotification,
  Doctor,
  Insurance,
  Patient,
  Room,
  ScheduleBlock,
  Settings,
  Specialty,
} from "./types";
import { blockAppliesOn, blockSlots } from "./rules";

/** Fecha de trabajo simulada: hoy a las 10:30. */
export function workingNow() {
  const d = startOfDay(new Date());
  d.setHours(10, 30, 0, 0);
  return d;
}

export const specialties: Specialty[] = [
  { id: "sp-clinica", name: "Clínica médica", icon: "stethoscope", description: "Controles generales y seguimiento integral.", duration: 20, active: true },
  { id: "sp-cardio", name: "Cardiología", icon: "heart-pulse", description: "Prevención y control cardiovascular.", duration: 30, active: true },
  { id: "sp-pedia", name: "Pediatría", icon: "baby", description: "Atención de niñas, niños y adolescentes.", duration: 20, active: true },
  { id: "sp-derma", name: "Dermatología", icon: "scan-face", description: "Cuidado de la piel, cabello y uñas.", duration: 20, active: true },
  { id: "sp-trauma", name: "Traumatología", icon: "bone", description: "Lesiones, articulaciones y movilidad.", duration: 20, active: true },
  { id: "sp-gine", name: "Ginecología", icon: "flower", description: "Salud ginecológica y controles anuales.", duration: 30, active: true },
  { id: "sp-oftalmo", name: "Oftalmología", icon: "eye", description: "Control visual y salud ocular.", duration: 20, active: true },
  { id: "sp-neuro", name: "Neurología", icon: "brain", description: "Consultas sobre sistema nervioso.", duration: 30, active: true },
];

export const insurances: Insurance[] = [
  { id: "in-osde", name: "OSDE", type: "Prepaga", active: true },
  { id: "in-swiss", name: "Swiss Medical", type: "Prepaga", active: true },
  { id: "in-galeno", name: "Galeno", type: "Prepaga", active: true },
  { id: "in-pami", name: "PAMI", type: "Obra social", active: true },
  { id: "in-ioma", name: "IOMA", type: "Obra social", active: true },
  { id: "in-part", name: "Particular", type: "Particular", active: true },
];

export const rooms: Room[] = [
  { id: "rm-101", code: "Consultorio 101", floor: 1, specialtyIds: ["sp-clinica", "sp-pedia"], equipment: "Camilla, balanza pediátrica", active: true },
  { id: "rm-102", code: "Consultorio 102", floor: 1, specialtyIds: ["sp-cardio"], equipment: "Electrocardiógrafo, tensiómetro", active: true },
  { id: "rm-104", code: "Consultorio 104", floor: 1, specialtyIds: ["sp-trauma", "sp-clinica"], equipment: "Negatoscopio, camilla", active: true },
  { id: "rm-201", code: "Consultorio 201", floor: 2, specialtyIds: ["sp-derma"], equipment: "Dermatoscopio, lámpara", active: true },
  { id: "rm-203", code: "Consultorio 203", floor: 2, specialtyIds: ["sp-gine"], equipment: "Camilla ginecológica, ecógrafo", active: true },
  { id: "rm-205", code: "Consultorio 205", floor: 2, specialtyIds: ["sp-oftalmo", "sp-neuro"], equipment: "Lámpara de hendidura, cartilla", active: true },
];

const allIns = insurances.map((i) => i.id);
export const doctors: Doctor[] = [
  { id: "dr-fernandez", title: "Dra.", firstName: "Lucía", lastName: "Fernández", specialtyId: "sp-cardio", license: "MN 112.458", years: 14, email: "lfernandez@saludintegral.demo", phone: "11 4521-3301", roomId: "rm-102", insuranceIds: ["in-osde", "in-swiss", "in-galeno", "in-part"], bio: "Especialista en cardiología preventiva y control de hipertensión. Enfoque en hábitos y seguimiento a largo plazo.", active: true },
  { id: "dr-gonzalez", title: "Dr.", firstName: "Martín", lastName: "González", specialtyId: "sp-clinica", license: "MN 98.774", years: 18, email: "mgonzalez@saludintegral.demo", phone: "11 4521-3302", roomId: "rm-101", insuranceIds: allIns, bio: "Médico clínico con amplia experiencia en atención primaria y controles anuales de adultos.", active: true },
  { id: "dr-rodriguez", title: "Dra.", firstName: "Camila", lastName: "Rodríguez", specialtyId: "sp-pedia", license: "MN 130.215", years: 9, email: "crodriguez@saludintegral.demo", phone: "11 4521-3303", roomId: "rm-101", insuranceIds: ["in-osde", "in-swiss", "in-ioma", "in-part"], bio: "Pediatra dedicada al acompañamiento del crecimiento y los controles de salud infantil.", active: true },
  { id: "dr-lopez", title: "Dr.", firstName: "Santiago", lastName: "López", specialtyId: "sp-trauma", license: "MN 105.632", years: 12, email: "slopez@saludintegral.demo", phone: "11 4521-3304", roomId: "rm-104", insuranceIds: ["in-osde", "in-galeno", "in-pami", "in-part"], bio: "Traumatólogo orientado a lesiones deportivas y rehabilitación funcional.", active: true },
  { id: "dr-perez", title: "Dra.", firstName: "Valentina", lastName: "Pérez", specialtyId: "sp-derma", license: "MN 127.904", years: 8, email: "vperez@saludintegral.demo", phone: "11 4521-3305", roomId: "rm-201", insuranceIds: ["in-osde", "in-swiss", "in-part"], bio: "Dermatóloga clínica, controles de lunares y cuidado preventivo de la piel.", active: true },
  { id: "dr-romero", title: "Dr.", firstName: "Nicolás", lastName: "Romero", specialtyId: "sp-neuro", license: "MN 101.337", years: 16, email: "nromero@saludintegral.demo", phone: "11 4521-3306", roomId: "rm-205", insuranceIds: ["in-osde", "in-galeno", "in-ioma", "in-part"], bio: "Neurólogo con foco en cefaleas y trastornos del sueño.", active: true },
  { id: "dr-martinez", title: "Dra.", firstName: "Sofía", lastName: "Martínez", specialtyId: "sp-gine", license: "MN 118.560", years: 11, email: "smartinez@saludintegral.demo", phone: "11 4521-3307", roomId: "rm-203", insuranceIds: ["in-osde", "in-swiss", "in-galeno", "in-pami", "in-part"], bio: "Ginecóloga con experiencia en controles anuales y salud integral de la mujer.", active: true },
  { id: "dr-herrera", title: "Dr.", firstName: "Tomás", lastName: "Herrera", specialtyId: "sp-oftalmo", license: "MN 109.881", years: 13, email: "therrera@saludintegral.demo", phone: "11 4521-3308", roomId: "rm-205", insuranceIds: ["in-osde", "in-swiss", "in-pami", "in-part"], bio: "Oftalmólogo, control visual de adultos y adultos mayores.", active: true },
];

const SCHED: [string, number[], string, string][] = [
  ["dr-fernandez", [1, 3, 5], "09:00", "13:00"],
  ["dr-gonzalez", [1, 2, 3, 4, 5], "08:00", "12:00"],
  ["dr-rodriguez", [2, 4, 6], "09:00", "13:00"],
  ["dr-lopez", [1, 3, 4], "14:00", "18:00"],
  ["dr-perez", [2, 4], "09:00", "12:00"],
  ["dr-romero", [3, 5], "14:00", "18:00"],
  ["dr-martinez", [1, 2, 5], "10:00", "14:00"],
  ["dr-herrera", [2, 3, 4], "08:30", "12:30"],
];
export const schedules: ScheduleBlock[] = SCHED.flatMap(([doctorId, days, start, end]) => {
  const dur = specialties.find((s) => s.id === doctors.find((d) => d.id === doctorId)!.specialtyId)!.duration;
  return days.map((weekday) => ({
    id: `sc-${doctorId}-${weekday}`,
    doctorId,
    weekday,
    start,
    end,
    duration: dur,
    gap: 0,
    startDate: "2024-01-01",
    repeat: "semanal" as const,
  }));
});

const P: [string, string, string][] = [
  ["María", "Gómez", "in-osde"], ["Juan", "Pereyra", "in-swiss"], ["Ana", "Sosa", "in-galeno"], ["Carlos", "Díaz", "in-pami"],
  ["Laura", "Benítez", "in-osde"], ["Diego", "Acosta", "in-ioma"], ["Paula", "Medina", "in-part"], ["Federico", "Ruiz", "in-osde"],
  ["Julieta", "Castro", "in-swiss"], ["Ricardo", "Molina", "in-pami"], ["Florencia", "Ortiz", "in-galeno"], ["Gustavo", "Silva", "in-ioma"],
  ["Agustina", "Navarro", "in-osde"], ["Hernán", "Torres", "in-part"], ["Rocío", "Vega", "in-swiss"], ["Pablo", "Ríos", "in-galeno"],
  ["Mariana", "Suárez", "in-osde"], ["Esteban", "Luna", "in-pami"], ["Carolina", "Ibáñez", "in-ioma"], ["Ignacio", "Paz", "in-swiss"],
];
export const patients: Patient[] = P.map(([firstName, lastName, insuranceId], i) => ({
  id: `pa-${String(i + 1).padStart(2, "0")}`,
  firstName,
  lastName,
  dni: `${30 + (i % 15)}.${String(100 + i * 37).slice(-3)}.${String(200 + i * 53).slice(-3)}`,
  birth: `${1958 + ((i * 7) % 45)}-${String((i % 12) + 1).padStart(2, "0")}-${String((i % 27) + 1).padStart(2, "0")}`,
  email: `${firstName}.${lastName}`.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") + "@correo.demo",
  phone: `11 5${String(100 + i * 13).slice(-3)}-${String(4000 + i * 211).slice(-4)}`,
  insuranceId,
  affiliate: insuranceId === "in-part" ? "" : `${String(80000 + i * 1373)}-0${i % 9}`,
}));

export const DEMO_PATIENT_ID = "pa-01";

export const defaultSettings: Settings = {
  centerName: "Centro Médico Salud Integral",
  waitModerate: 15,
  waitHigh: 30,
  checkinWindowMinutes: 120,
  cancelMinHours: 2,
  defaultDuration: 20,
  reminders: true,
  allowOnlineBooking: true,
};

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function seedAppointments(now = workingNow()): Appointment[] {
  const r = rng(42);
  const today = startOfDay(now);
  const out: Appointment[] = [];
  let n = 24001;
  const busy = new Set<string>();
  for (let d = -28; d <= 21; d++) {
    const date = addDays(today, d);
    for (const b of schedules) {
      if (!blockAppliesOn(b, date)) continue;
      const doc = doctors.find((x) => x.id === b.doctorId)!;
      const fill = d < 0 ? 0.7 : d === 0 ? 0.75 : Math.max(0.15, 0.6 - d * 0.03);
      for (const slot of blockSlots(b, date)) {
        if (r() > fill) continue;
        let patient = patients[Math.floor(r() * patients.length)]!;
        if (patient.id === DEMO_PATIENT_ID) patient = patients[1 + Math.floor(r() * 19)]!;
        const key = `${patient.id}-${slot.getTime()}`;
        if (busy.has(key)) continue;
        busy.add(key);
        const isPast = slot.getTime() + b.duration * 60000 <= now.getTime();
        const a: Appointment = {
          id: `SI-${n++}`,
          patientId: patient.id,
          doctorId: doc.id,
          specialtyId: doc.specialtyId,
          roomId: doc.roomId,
          insuranceId: doc.insuranceIds.includes(patient.insuranceId) ? patient.insuranceId : "in-part",
          start: formatISO(slot),
          duration: b.duration,
          status: "Reservado",
          createdAt: formatISO(addDays(slot, -(3 + Math.floor(r() * 10)))),
        };
        const x = r();
        if (isPast) {
          if (x < 0.12) {
            a.status = "Cancelado";
            a.cancellationReason = "Cancelado por el paciente";
          } else if (x < 0.22) a.status = "Ausente";
          else {
            a.status = "Atendido";
            a.arrivedAt = formatISO(addMinutes(slot, -Math.floor(r() * 15)));
            a.startedAt = formatISO(addMinutes(slot, Math.floor(r() * 22)));
          }
        } else if (d === 0 && slot.getTime() <= now.getTime() + 15 * 60000) {
          // turnos en curso o próximos de hoy: algunos ya llegaron
          if (x < 0.75) {
            a.status = "Confirmado";
            a.arrivedAt = formatISO(addMinutes(slot, -(5 + Math.floor(r() * 25))));
            if (new Date(a.arrivedAt) > now) a.arrivedAt = formatISO(addMinutes(now, -3));
          } else a.status = "Reservado";
        } else {
          if (x < 0.06) {
            a.status = "Cancelado";
            a.cancellationReason = "Reprogramación solicitada";
          } else a.status = d <= 2 && x < 0.5 ? "Confirmado" : "Reservado";
        }
        out.push(a);
      }
    }
  }
  // Turnos del paciente demo
  const assign = (pred: (a: Appointment) => boolean, patch: Partial<Appointment> = {}) => {
    const a = out.find((x) => pred(x) && x.patientId !== DEMO_PATIENT_ID);
    if (a) Object.assign(a, { patientId: DEMO_PATIENT_ID, insuranceId: "in-osde" }, patch);
  };
  const t = now.getTime();
  assign((a) => a.doctorId === "dr-fernandez" && new Date(a.start).getTime() > t + 86400000 && a.status === "Reservado");
  assign((a) => a.doctorId === "dr-perez" && new Date(a.start).getTime() > t + 6 * 86400000 && a.status === "Reservado");
  assign((a) => a.doctorId === "dr-gonzalez" && a.status === "Atendido");
  assign((a) => a.doctorId === "dr-herrera" && a.status === "Atendido");
  assign((a) => a.doctorId === "dr-martinez" && a.status === "Cancelado");
  return out;
}

export function seedNotifications(): AppNotification[] {
  const now = new Date().toISOString();
  return [
    { id: "n1", title: "Recordatorio de turno", body: "Tenés un turno de Cardiología en los próximos días.", at: now, read: false, audience: "paciente" },
    { id: "n2", title: "Cobertura actualizada", body: "Tus datos de cobertura se verificaron (simulación).", at: now, read: true, audience: "paciente" },
    { id: "n3", title: "Sala de espera", body: "Hay pacientes esperando más de 15 minutos.", at: now, read: false, audience: "staff" },
    { id: "n4", title: "Agenda", body: "Se actualizó la agenda de la Dra. Pérez.", at: now, read: true, audience: "staff" },
  ];
}
