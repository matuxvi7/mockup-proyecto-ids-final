import { createFileRoute, Link } from "@tanstack/react-router";
import { differenceInMinutes, isSameDay, parseISO } from "date-fns";
import { Armchair, Clock, Play, QrCode, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, CardHeader, EmptyState, PageTitle, StatusBadge, Tag, buttonVariants } from "@/components/kit";
import { useLookup, useStore } from "@/lib/store";
import { waitLevel } from "@/lib/rules";
import { fTime, pageHead } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/sala-espera")({
  head: () => pageHead("Sala de espera", "Pacientes en espera ordenados por hora de llegada (demo)."),
  component: Page,
});

function Page() {
  const s = useStore();
  const L = useLookup();
  const today = s.appointments.filter((a) => isSameDay(parseISO(a.start), s.now));
  const queue = today
    .filter((a) => a.arrivedAt && a.status === "Confirmado")
    .sort((a, b) => a.arrivedAt!.localeCompare(b.arrivedAt!));
  const pending = today
    .filter((a) => !a.arrivedAt && (a.status === "Reservado" || a.status === "Confirmado"))
    .sort((a, b) => a.start.localeCompare(b.start));

  const start = (id: string) => { s.startConsult(id); toast.success("Paciente llamado al consultorio", { description: "Operación demostrativa" }); };
  const finish = (id: string) => { const r = s.setStatus(id, "Atendido"); r.ok ? toast.success("Atención finalizada") : toast.error(r.error); };
  const absent = (id: string) => { const r = s.setStatus(id, "Ausente"); r.ok ? toast("Turno marcado como ausente") : toast.error(r.error); };

  return (
    <>
      <PageTitle title="Sala de espera" subtitle="Orden por hora de llegada. La espera se calcula sobre la hora simulada." action={<Link to="/admin/check-in" className={buttonVariants()}><QrCode aria-hidden /> Registrar llegada</Link>} />
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader title={`En espera (${queue.length})`} subtitle="Pacientes con check-in registrado" />
          {queue.length === 0 ? (
            <EmptyState icon={<Armchair className="size-6" />} title="No hay pacientes en espera" body="Cuando se registre una llegada aparecerá en esta lista." />
          ) : (
            <ol className="divide-y">
              {queue.map((a, i) => {
                const wait = Math.max(0, differenceInMinutes(a.startedAt ? parseISO(a.startedAt) : s.now, parseISO(a.arrivedAt!)));
                const lvl = waitLevel(wait, s.settings);
                return (
                  <li key={a.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                    <span className="flex size-9 items-center justify-center rounded-full bg-petrol text-sm font-bold text-petrol-foreground">{i + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{L.patientName(a.patientId)}</p>
                      <p className="text-sm text-muted-foreground">{L.doctorName(a.doctorId)} · {L.roomName(a.roomId)} · turno {fTime(a.start)}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="text-muted-foreground">Llegó {fTime(a.arrivedAt!)}</p>
                      <Tag tone={lvl === "normal" ? "success" : lvl === "moderada" ? "warning" : "danger"}><Clock className="mr-1 size-3" aria-hidden />{wait} min · {lvl}</Tag>
                    </div>
                    {a.startedAt ? (
                      <div className="flex items-center gap-2"><Tag tone="primary">En consulta</Tag><Button size="sm" variant="success" onClick={() => finish(a.id)}>Finalizar</Button></div>
                    ) : (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => start(a.id)}><Play aria-hidden /> Llamar</Button>
                        <Button size="sm" variant="ghost" aria-label="Marcar ausente" onClick={() => absent(a.id)}><UserX /></Button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </Card>
        <Card>
          <CardHeader title={`Por llegar hoy (${pending.length})`} subtitle="Turnos sin check-in" />
          <ul className="max-h-[60vh] divide-y overflow-y-auto">
            {pending.map((a) => {
              const late = parseISO(a.start) < s.now;
              return (
                <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                  <span className={cn("w-12 font-mono text-sm font-semibold", late && "text-destructive")}>{fTime(a.start)}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{L.patientName(a.patientId)}</p><p className="truncate text-xs text-muted-foreground">{L.doctorName(a.doctorId)}</p></div>
                  {late && a.status === "Confirmado" ? (
                    <Button size="sm" variant="outline" onClick={() => absent(a.id)}>Ausente</Button>
                  ) : (
                    <StatusBadge status={a.status} />
                  )}
                </li>
              );
            })}
            {!pending.length && <li className="px-5 py-6 text-sm text-muted-foreground">Todos los pacientes del día ya llegaron.</li>}
          </ul>
        </Card>
      </div>
    </>
  );
}
