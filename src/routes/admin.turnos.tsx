import { createFileRoute } from "@tanstack/react-router";
import { isSameDay, parseISO, startOfDay } from "date-fns";
import { Plus, Search } from "lucide-react";
import { useState } from "react";
import { Button, Card, EmptyState, Input, PageTitle, Select, StatusBadge, Table, td } from "@/components/kit";
import { AppointmentDetailModal } from "@/components/shared";
import { NewAppointmentModal } from "@/components/new-appointment";
import { useLookup, useStore } from "@/lib/store";
import { fDate, fTime, pageHead } from "@/lib/format";
import { STATUSES, type Appointment } from "@/lib/types";

export const Route = createFileRoute("/admin/turnos")({
  head: () => pageHead("Gestión de turnos", "Listado y seguimiento de turnos del centro médico (demo)."),
  component: Page,
});

function Page() {
  const s = useStore();
  const L = useLookup();
  const [q, setQ] = useState("");
  const [when, setWhen] = useState("hoy");
  const [status, setStatus] = useState("");
  const [sp, setSp] = useState("");
  const [doc, setDoc] = useState("");
  const [sel, setSel] = useState<Appointment | null>(null);
  const [creating, setCreating] = useState(false);
  const [limit, setLimit] = useState(50);
  const today = startOfDay(s.now);

  const list = s.appointments
    .filter((a) => {
      const d = parseISO(a.start);
      if (when === "hoy" && !isSameDay(d, s.now)) return false;
      if (when === "proximos" && d < today) return false;
      if (when === "pasados" && d >= today) return false;
      if (status && a.status !== status) return false;
      if (sp && a.specialtyId !== sp) return false;
      if (doc && a.doctorId !== doc) return false;
      if (q && !`${a.id} ${L.patientName(a.patientId)} ${L.patient(a.patientId)?.dni}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => (when === "pasados" ? b.start.localeCompare(a.start) : a.start.localeCompare(b.start)));

  const clear = () => { setQ(""); setStatus(""); setSp(""); setDoc(""); setWhen("todos"); };

  return (
    <>
      <PageTitle title="Turnos" subtitle="Búsqueda, filtros y cambio de estado de los turnos." action={<Button onClick={() => setCreating(true)}><Plus aria-hidden /> Nuevo turno</Button>} />
      <Card>
        <div className="grid gap-3 border-b p-4 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="relative">
            <Search className="absolute top-3.5 left-3 size-4 text-muted-foreground" aria-hidden />
            <Input aria-label="Buscar" placeholder="Paciente, DNI o código…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select aria-label="Período" value={when} onChange={(e) => setWhen(e.target.value)}>
            <option value="hoy">Hoy</option>
            <option value="proximos">Próximos</option>
            <option value="pasados">Pasados</option>
            <option value="todos">Todos</option>
          </Select>
          <Select aria-label="Estado" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos los estados</option>
            {STATUSES.filter((x) => x !== "Disponible").map((x) => <option key={x}>{x}</option>)}
          </Select>
          <Select aria-label="Especialidad" value={sp} onChange={(e) => setSp(e.target.value)}>
            <option value="">Todas las especialidades</option>
            {s.specialties.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </Select>
          <Select aria-label="Profesional" value={doc} onChange={(e) => setDoc(e.target.value)}>
            <option value="">Todos los profesionales</option>
            {s.doctors.map((d) => <option key={d.id} value={d.id}>{L.doctorName(d.id)}</option>)}
          </Select>
        </div>
        <div className="flex items-center justify-between px-4 py-2 text-sm text-muted-foreground">
          <span>{list.length} turnos</span>
          <button className="font-medium text-primary hover:underline" onClick={clear}>Limpiar filtros</button>
        </div>
        {list.length === 0 ? (
          <EmptyState title="No hay turnos" body="Ningún turno coincide con los filtros aplicados." action={<Button variant="outline" onClick={clear}>Limpiar filtros</Button>} />
        ) : (
          <>
            <Table head={["Código", "Fecha", "Hora", "Paciente", "Profesional", "Consultorio", "Estado"]}>
              {list.slice(0, limit).map((a) => (
                <tr key={a.id} onClick={() => setSel(a)} className="cursor-pointer hover:bg-muted/40">
                  <td className={`${td} font-mono text-xs`}>{a.id}</td>
                  <td className={`${td} capitalize`}>{fDate(a.start)}</td>
                  <td className={`${td} font-semibold`}>{fTime(a.start)}</td>
                  <td className={td}>{L.patientName(a.patientId)}</td>
                  <td className={td}><p>{L.doctorName(a.doctorId)}</p><p className="text-xs text-muted-foreground">{L.specialtyName(a.specialtyId)}</p></td>
                  <td className={td}>{L.roomName(a.roomId)}</td>
                  <td className={td}><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </Table>
            {list.length > limit && (
              <div className="border-t p-3 text-center"><Button variant="ghost" onClick={() => setLimit(limit + 50)}>Mostrar más ({list.length - limit} restantes)</Button></div>
            )}
          </>
        )}
      </Card>
      <AppointmentDetailModal appt={sel} onClose={() => setSel(null)} />
      <NewAppointmentModal open={creating} onOpenChange={setCreating} />
    </>
  );
}
