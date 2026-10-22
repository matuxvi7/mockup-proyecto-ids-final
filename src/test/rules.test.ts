import { describe, expect, it } from "vitest";
import { canPatientCancel, canTransition } from "@/lib/rules";
import type { Appointment } from "@/lib/types";

const now = new Date("2026-10-22T10:30:00");
const base: Appointment = {
  id: "SI-1", patientId: "p", doctorId: "d", specialtyId: "s", roomId: "r", insuranceId: "i",
  start: "2026-10-23T10:30:00", duration: 20, status: "Reservado", createdAt: "2026-10-01T00:00:00",
};

describe("cancelación del paciente", () => {
  it("permite cancelar con anticipación suficiente", () => {
    expect(canPatientCancel(base, now, 24).ok).toBe(true);
  });
  it("rechaza cancelar con menos horas que el mínimo", () => {
    expect(canPatientCancel({ ...base, start: "2026-10-22T15:00:00" }, now, 24).ok).toBe(false);
  });
  it("rechaza cancelar un turno atendido", () => {
    expect(canPatientCancel({ ...base, status: "Atendido" }, now, 0).ok).toBe(false);
  });
});

describe("estados", () => {
  it("un turno atendido no puede cambiar", () => {
    expect(canTransition("Atendido", "Cancelado")).toBe(false);
  });
});
