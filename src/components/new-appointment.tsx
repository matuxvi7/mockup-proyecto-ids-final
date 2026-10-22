import { useState } from "react";
import { toast } from "sonner";
import { Button, Field, Modal, Select } from "./kit";
import { useLookup, useStore } from "@/lib/store";
import { daySlots, workingDays } from "@/lib/slots";
import { fLong, fTime } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Alta de turno desde recepción (simulada). */
export function NewAppointmentModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const s = useStore();
  const L = useLookup();
  const [patientId, setPatient] = useState("");
  const [doctorId, setDoctor] = useState("");
  const [day, setDay] = useState("");
  const [slot, setSlot] = useState("");
  const days = doctorId ? workingDays(s.schedules, doctorId, s.now, 14) : [];
  const slots = doctorId && day ? daySlots(s.appointments, s.schedules, doctorId, new Date(day), s.now) : [];
  const reset = () => { setPatient(""); setDoctor(""); setDay(""); setSlot(""); };

  const submit = () => {
    if (!patientId || !doctorId || !slot) return void toast.error("Completá paciente, profesional y horario.");
    const p = L.patient(patientId)!;
    const d = L.doctor(doctorId)!;
    const r = s.bookAppointment({ patientId, doctorId, start: new Date(slot), insuranceId: d.insuranceIds.includes(p.insuranceId) ? p.insuranceId : "in-part" });
    if (!r.ok) return void toast.error(r.error);
    s.notify("Turno creado por recepción", `${r.id} · ${L.patientName(patientId)} con ${L.doctorName(doctorId)}`, "staff");
    toast.success(`Turno ${r.id} reservado`, { description: "Operación demostrativa" });
    reset();
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}
      title="Nuevo turno"
      description="Reserva administrativa en nombre del paciente"
      wide
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button onClick={submit} disabled={!slot}>Reservar turno</Button></>}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Paciente">
          <Select value={patientId} onChange={(e) => setPatient(e.target.value)}>
            <option value="">Seleccionar…</option>
            {s.patients.map((p) => <option key={p.id} value={p.id}>{p.lastName}, {p.firstName} · DNI {p.dni}</option>)}
          </Select>
        </Field>
        <Field label="Profesional">
          <Select value={doctorId} onChange={(e) => { setDoctor(e.target.value); setDay(""); setSlot(""); }}>
            <option value="">Seleccionar…</option>
            {s.doctors.filter((d) => d.active).map((d) => <option key={d.id} value={d.id}>{L.doctorName(d.id)} · {L.specialtyName(d.specialtyId)}</option>)}
          </Select>
        </Field>
        <Field label="Fecha" className="sm:col-span-2">
          <Select value={day} onChange={(e) => { setDay(e.target.value); setSlot(""); }} disabled={!doctorId}>
            <option value="">{doctorId ? "Seleccionar…" : "Elegí un profesional primero"}</option>
            {days.map((d) => <option key={d.toISOString()} value={d.toISOString()} className="capitalize">{fLong(d)}</option>)}
          </Select>
        </Field>
      </div>
      {day && (
        <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {slots.map((x) => (
            <button
              key={x.start.toISOString()}
              disabled={x.state !== "libre"}
              onClick={() => setSlot(x.start.toISOString())}
              className={cn(
                "rounded-lg border py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:line-through",
                slot === x.start.toISOString() ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary",
              )}
            >
              {fTime(x.start)}
            </button>
          ))}
          {!slots.length && <p className="col-span-full text-sm text-muted-foreground">Sin franjas para esta fecha.</p>}
        </div>
      )}
    </Modal>
  );
}
