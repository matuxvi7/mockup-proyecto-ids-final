import { createFileRoute } from "@tanstack/react-router";
import { addDays, addWeeks, isSameDay, parseISO, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import { Button, Card, PageTitle, Select } from "@/components/kit";
import { AppointmentDetailModal } from "@/components/shared";
import { NewAppointmentModal } from "@/components/new-appointment";
import { useLookup, useStore } from "@/lib/store";
import { fDate, fTime, pageHead } from "@/lib/format";
import type { Appointment, Status } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/calendario")({
  head: () => pageHead("Calendario de turnos", "Vista semanal de turnos por profesional (demo)."),
  component: Page,
});

const tone: Record<Exclude<Status, "Disponible">, string> = {
  Reservado: "border-l-primary bg-primary-soft",
  Confirmado: "border-l-success bg-success-soft",
  Atendido: "border-l-success-strong bg-muted",
  Cancelado: "border-l-destructive bg-destructive-soft opacity-70 line-through",
  Ausente: "border-l-warning bg-warning-soft",
};

function Page() {
  const s = useStore();
  const L = useLookup();
  const [week, setWeek] = useState(0);
  const [doc, setDoc] = useState("");
  const [showCancelled, setShowCancelled] = useState(false);
  const [sel, setSel] = useState<Appointment | null>(null);
  const [creating, setCreating] = useState(false);
  const start = addWeeks(startOfWeek(s.now, { weekStartsOn: 1 }), week);
  const days = Array.from({ length: 6 }, (_, i) => addDays(start, i));

  return (
    <>
      <PageTitle
        title="Calendario"
        subtitle="Turnos de la semana por día. Hacé clic en un turno para ver el detalle."
        action={<Button onClick={() => setCreating(true)}><Plus aria-hidden /> Nuevo turno</Button>}
      />
      <Card className="mb-4 flex flex-wrap items-center gap-3 p-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" aria-label="Semana anterior" onClick={() => setWeek(week - 1)}><ChevronLeft /></Button>
          <Button variant="outline" size="sm" onClick={() => setWeek(0)}>Hoy</Button>
          <Button variant="outline" size="icon" aria-label="Semana siguiente" onClick={() => setWeek(week + 1)}><ChevronRight /></Button>
        </div>
        <p className="font-semibold capitalize">{fDate(days[0]!, "d 'de' MMM")} – {fDate(days[5]!, "d 'de' MMM yyyy")}</p>
        <Select aria-label="Profesional" className="ml-auto w-64" value={doc} onChange={(e) => setDoc(e.target.value)}>
          <option value="">Todos los profesionales</option>
          {s.doctors.map((d) => <option key={d.id} value={d.id}>{L.doctorName(d.id)}</option>)}
        </Select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-primary" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} /> Ver cancelados</label>
      </Card>
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {days.map((d) => {
          const list = s.appointments
            .filter((a) => isSameDay(parseISO(a.start), d) && (!doc || a.doctorId === doc) && (showCancelled || a.status !== "Cancelado"))
            .sort((a, b) => a.start.localeCompare(b.start));
          const isToday = isSameDay(d, s.now);
          return (
            <Card key={d.toISOString()} className={cn("flex max-h-[70vh] flex-col overflow-hidden", isToday && "border-primary")}>
              <div className={cn("border-b px-3 py-2", isToday && "bg-primary-soft")}>
                <p className="text-xs font-semibold text-muted-foreground uppercase">{fDate(d, "EEEE")}</p>
                <p className="text-lg font-bold">{fDate(d, "d")}<span className="ml-2 text-xs font-medium text-muted-foreground">{list.length} turnos</span></p>
              </div>
              <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
                {list.map((a) => (
                  <button key={a.id} onClick={() => setSel(a)} className={cn("w-full rounded-md border-l-4 px-2 py-1.5 text-left text-xs transition-transform hover:scale-[1.02]", tone[a.status])}>
                    <p className="font-semibold">{fTime(a.start)} · {L.patientName(a.patientId)}</p>
                    <p className="truncate text-muted-foreground">{L.doctorName(a.doctorId)}</p>
                  </button>
                ))}
                {!list.length && <p className="p-2 text-xs text-muted-foreground">Sin turnos</p>}
              </div>
            </Card>
          );
        })}
      </div>
      <AppointmentDetailModal appt={sel} onClose={() => setSel(null)} />
      <NewAppointmentModal open={creating} onOpenChange={setCreating} />
    </>
  );
}
