export const STATUSES = [
  "Disponible",
  "Reservado",
  "Confirmado",
  "Atendido",
  "Cancelado",
  "Ausente",
] as const;
export type Status = (typeof STATUSES)[number];

export type Role = "paciente" | "recepcion" | "admin";

export interface Specialty {
  id: string;
  name: string;
  icon: string;
  description: string;
  duration: number;
  active: boolean;
}

export interface Doctor {
  id: string;
  title: "Dr." | "Dra.";
  firstName: string;
  lastName: string;
  specialtyId: string;
  license: string;
  years: number;
  email: string;
  phone: string;
  roomId: string;
  insuranceIds: string[];
  bio: string;
  active: boolean;
}

export interface Room {
  id: string;
  code: string;
  floor: number;
  specialtyIds: string[];
  equipment: string;
  active: boolean;
}

export interface Insurance {
  id: string;
  name: string;
  type: "Prepaga" | "Obra social" | "Particular";
  active: boolean;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  birth: string;
  email: string;
  phone: string;
  insuranceId: string;
  affiliate: string;
}

export interface ScheduleBlock {
  id: string;
  doctorId: string;
  weekday: number; // 0 domingo … 6 sábado
  start: string; // "HH:mm"
  end: string;
  duration: number;
  gap: number;
  startDate: string; // yyyy-MM-dd
  repeat: "semanal" | "mensual";
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  specialtyId: string;
  roomId: string;
  insuranceId: string;
  start: string; // ISO
  duration: number;
  status: Exclude<Status, "Disponible">;
  createdAt: string;
  arrivedAt?: string;
  startedAt?: string;
  cancellationReason?: string;
}

export interface Settings {
  centerName: string;
  waitModerate: number;
  waitHigh: number;
  checkinWindowMinutes: number;
  cancelMinHours: number;
  defaultDuration: number;
  reminders: boolean;
  allowOnlineBooking: boolean;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  audience: "paciente" | "staff";
}
