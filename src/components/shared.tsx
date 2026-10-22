import * as Popover from "@radix-ui/react-popover";
import { Link } from "@tanstack/react-router";
import { Bell, CalendarClock, MapPin, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { useLookup, useStore } from "@/lib/store";
import { canTransition } from "@/lib/rules";
import { fLong, fTime } from "@/lib/format";
import type { Appointment, Doctor, Status } from "@/lib/types";
import { Avatar, Button, Modal, StatusBadge, Tag, buttonVariants } from "./kit";
import { cn } from "@/lib/utils";
import { slotState, blockAppliesOn, blockSlots } from "@/lib/rules";
import { addDays, startOfDay } from "date-fns";

export function NotificationBell({ audience }: { audience: "paciente" | "staff" }) {
  const s = useStore();
  const list = s.notifications.filter((n) => n.audience === audience);
  const unread = list.filter((n) => !n.read).length;
  return (
    <Popover.Root onOpenChange={(o) => !o && s.markNotificationsRead(audience)}>
      <Popover.Trigger className="relative rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label={`Notificaciones${unread ? `, ${unread} sin leer` : ""}`}>
        <Bell className="size-5" aria-hidden />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">{unread}</span>
        )}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={8} className="z-50 w-80 rounded-xl border bg-popover shadow-pop animate-in fade-in-0">
          <div className="border-b px-4 py-3 text-sm font-semibold">Notificaciones</div>
          <ul className="max-h-80 divide-y overflow-y-auto">
            {list.map((n) => (
              <li key={n.id} className="flex gap-3 px-4 py-3">
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.read ? "bg-input" : "bg-primary")} aria-hidden />
                <div>
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function DoctorCard({ d }: { d: Doctor }) {
  const s = useStore();
  const L = useLookup();
  const next = nextAvailable(d.id);
  const nextLabel = next ? `${fLong(next)} · ${fTime(next)}` : "Sin disponibilidad próxima";
  function nextAvailable(id: string) {
    for (let i = 0; i < 21; i++) {
      const date = addDays(startOfDay(s.now), i);
      for (const b of s.schedules.filter((x) => x.doctorId === id && blockAppliesOn(x, date))) {
        const slot = blockSlots(b, date).find((t) => slotState(s.appointments, id, t, b.duration, s.now) === "libre");
        if (slot) return slot;
      }
    }
    return null;
  }
  return (
    <article className="flex flex-col rounded-xl border bg-card p-5 shadow-card transition-colors hover:border-primary/40">
      <div className="flex gap-4">
        <Avatar name={`${d.firstName} ${d.lastName}`} size="lg" />
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground">{d.title} {d.firstName} {d.lastName}</h3>
          <p className="text-sm text-primary">{L.specialtyName(d.specialtyId)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{d.license} · {d.years} años de experiencia</p>
        </div>
      </div>
      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex items-center gap-2 text-foreground"><CalendarClock className="size-4 text-teal" aria-hidden /><dt className="sr-only">Próxima disponibilidad</dt><dd className="capitalize">{nextLabel}</dd></div>
        <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="size-4" aria-hidden /><dt className="sr-only">Consultorio</dt><dd>{L.roomName(d.roomId)}</dd></div>
        <div className="flex items-start gap-2 text-muted-foreground"><ShieldCheck className="mt-0.5 size-4" aria-hidden /><dt className="sr-only">Coberturas</dt><dd className="flex flex-wrap gap-1">{d.insuranceIds.slice(0, 4).map((i) => <Tag key={i}>{L.insuranceName(i)}</Tag>)}{d.insuranceIds.length > 4 && <Tag>+{d.insuranceIds.length - 4}</Tag>}</dd></div>
      </dl>
      <div className="mt-5 flex gap-2 pt-1">
        <Link to="/medicos/$id" params={{ id: d.id }} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1")}>Ver perfil</Link>
        <Link to="/reservar-turno" search={{ doctor: d.id }} className={cn(buttonVariants({ size: "sm" }), "flex-1")}>Reservar turno</Link>
      </div>
    </article>
  );
}

const ACTION_LABEL: Partial<Record<Status, string>> = {
  Confirmado: "Confirmar",
  Atendido: "Marcar atendido",
  Ausente: "Marcar ausente",
  Cancelado: "Cancelar turno",
};

export function AppointmentDetailModal({ appt, onClose }: { appt: Appointment | null; onClose: () => void }) {
  const s = useStore();
  const L = useLookup();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const a = appt ? s.appointments.find((x) => x.id === appt.id) ?? appt : null;
  if (!a) return null;
  const next = (["Confirmado", "Atendido", "Ausente", "Cancelado"] as Status[]).filter((t) => canTransition(a.status, t));
  const act = (to: Status) => {
    if (to === "Cancelado" && !confirmCancel) return setConfirmCancel(true);
    const r = s.setStatus(a.id, to, "Cancelado por recepción");
    if (r.ok) toast.success(`Turno ${a.id}: ${to}`, { description: "Operación demostrativa" });
    else toast.error(r.error);
    setConfirmCancel(false);
  };
  const rows: [string, string][] = [
    ["Paciente", L.patientName(a.patientId)],
    ["Profesional", L.doctorName(a.doctorId)],
    ["Especialidad", L.specialtyName(a.specialtyId)],
    ["Fecha", fLong(a.start)],
    ["Hora", `${fTime(a.start)} · ${a.duration} min`],
    ["Consultorio", L.roomName(a.roomId)],
    ["Cobertura", L.insuranceName(a.insuranceId)],
    ["Llegada", a.arrivedAt ? fTime(a.arrivedAt) : "Sin check-in"],
  ];
  return (
    <Modal
      open={!!appt}
      onOpenChange={(o) => { if (!o) { setConfirmCancel(false); onClose(); } }}
      title={`Turno ${a.id}`}
      description="Detalle y cambio de estado"
      footer={
        <>
          {a.status === "Ausente" && (
            <Button variant="outline" onClick={() => { s.revertAbsent(a.id); toast("Ausencia revertida (demostración)"); }}>Revertir ausencia</Button>
          )}
          {next.map((t) => (
            <Button key={t} variant={t === "Cancelado" ? "danger" : t === "Ausente" ? "outline" : "primary"} onClick={() => act(t)}>
              {t === "Cancelado" && confirmCancel ? "Confirmar cancelación" : ACTION_LABEL[t]}
            </Button>
          ))}
        </>
      }
    >
      <div className="mb-4"><StatusBadge status={a.status} /></div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        {rows.map(([k, v]) => (
          <div key={k}><dt className="text-xs text-muted-foreground">{k}</dt><dd className="font-medium capitalize-first">{v}</dd></div>
        ))}
      </dl>
      {a.cancellationReason && a.status === "Cancelado" && <p className="mt-4 rounded-lg bg-destructive-soft p-3 text-sm text-destructive">Motivo: {a.cancellationReason}</p>}
      {confirmCancel && <p className="mt-4 rounded-lg bg-warning-soft p-3 text-sm text-warning-foreground">¿Confirmás la cancelación? La franja quedará disponible nuevamente.</p>}
    </Modal>
  );
}
