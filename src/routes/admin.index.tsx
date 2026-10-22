import { createFileRoute, Link } from "@tanstack/react-router";
import { isSameDay, parseISO, subDays } from "date-fns";
import { Armchair, CalendarCheck, Clock, QrCode, UserX, Users } from "lucide-react";
import type { ReactNode } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardHeader, PageTitle, StatusBadge, buttonVariants } from "@/components/kit";
import { useLookup, useStore } from "@/lib/store";
import { absenteeismRate, averageWait } from "@/lib/rules";
import { fTime, pageHead } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  head: () => pageHead("Dashboard operativo", "Indicadores del día del Centro Médico Salud Integral (demo)."),
  component: Page,
});

export function Kpi({ icon, label, value, hint, tone = "primary" }: { icon: ReactNode; label: string; value: ReactNode; hint?: string; tone?: "primary" | "success" | "warning" | "danger" }) {
  const t = { primary: "bg-primary-soft text-primary", success: "bg-success-soft text-success-strong", warning: "bg-warning-soft text-warning-foreground", danger: "bg-destructive-soft text-destructive" }[tone];
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn("flex size-9 items-center justify-center rounded-lg [&_svg]:size-4", t)}>{icon}</span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}

function Page() {
  const s = useStore();
  const L = useLookup();
  const today = s.appointments.filter((a) => isSameDay(parseISO(a.start), s.now));
  const active = today.filter((a) => a.status !== "Cancelado");
  const waiting = today.filter((a) => a.arrivedAt && a.status === "Confirmado" && !a.startedAt);
  const done = today.filter((a) => a.status === "Atendido");
  const last30 = s.appointments.filter((a) => parseISO(a.start) >= subDays(s.now, 30) && parseISO(a.start) < s.now);
  const byHour = Array.from({ length: 11 }, (_, i) => i + 8).map((h) => ({
    hora: `${h}:00`,
    turnos: active.filter((a) => parseISO(a.start).getHours() === h).length,
  }));
  const upcoming = active.filter((a) => parseISO(a.start) >= s.now && !a.arrivedAt).sort((a, b) => a.start.localeCompare(b.start)).slice(0, 6);

  return (
    <>
      <PageTitle
        title={`Buen día, ${s.role === "recepcion" ? "Paula" : "Andrés"}`}
        subtitle="Resumen operativo de la jornada."
        action={<><Link to="/admin/check-in" className={buttonVariants({ variant: "outline" })}><QrCode aria-hidden /> Check-in</Link><Link to="/admin/turnos" className={buttonVariants()}>Ver turnos</Link></>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={<CalendarCheck />} label="Turnos de hoy" value={active.length} hint={`${done.length} atendidos`} />
        <Kpi icon={<Armchair />} label="En sala de espera" value={waiting.length} tone="success" hint="Con check-in registrado" />
        <Kpi icon={<Clock />} label="Espera promedio" value={`${averageWait(last30)} min`} tone="warning" hint="Últimos 30 días" />
        <Kpi icon={<UserX />} label="Ausentismo" value={`${Math.round(absenteeismRate(last30) * 100)}%`} tone="danger" hint="Últimos 30 días" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <Card>
          <CardHeader title="Turnos por hora" subtitle="Distribución de la jornada" />
          <div className="h-72 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byHour}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="hora" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                <Tooltip cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="turnos" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <CardHeader title="Próximos turnos" subtitle="Pendientes de llegada" action={<Link to="/admin/sala-espera" className="text-sm font-medium text-primary hover:underline">Sala de espera</Link>} />
          <ul className="divide-y">
            {upcoming.map((a) => (
              <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                <span className="w-12 font-mono text-sm font-semibold">{fTime(a.start)}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{L.patientName(a.patientId)}</p><p className="truncate text-xs text-muted-foreground">{L.doctorName(a.doctorId)} · {L.roomName(a.roomId)}</p></div>
                <StatusBadge status={a.status} />
              </li>
            ))}
            {!upcoming.length && <li className="px-5 py-6 text-sm text-muted-foreground">No quedan turnos por llegar.</li>}
          </ul>
        </Card>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Kpi icon={<Users />} label="Pacientes registrados" value={s.patients.length} />
        <Kpi icon={<Users />} label="Profesionales activos" value={s.doctors.filter((d) => d.active).length} tone="success" />
        <Kpi icon={<CalendarCheck />} label="Turnos futuros reservados" value={s.appointments.filter((a) => parseISO(a.start) > s.now && ["Reservado", "Confirmado"].includes(a.status)).length} />
      </div>
    </>
  );
}
