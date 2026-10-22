import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Clock, Mail, MapPin, Phone } from "lucide-react";
import { Avatar, Card, CardHeader, EmptyState, Tag, buttonVariants } from "@/components/kit";
import { useLookup, useStore } from "@/lib/store";
import { pageHead, WEEKDAYS } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_patient/medicos/$id")({
  head: () => pageHead("Perfil profesional", "Perfil, horarios de atención y coberturas del profesional en Salud Integral."),
  component: DoctorProfile,
});

function DoctorProfile() {
  const { id } = Route.useParams();
  const s = useStore();
  const L = useLookup();
  const d = L.doctor(id);
  if (!d) return <EmptyState title="Profesional no encontrado" action={<Link to="/medicos" className={buttonVariants()}>Ver profesionales</Link>} />;
  const blocks = s.schedules.filter((b) => b.doctorId === d.id).sort((a, b) => a.weekday - b.weekday);
  const sp = L.specialty(d.specialtyId);
  return (
    <>
      <Link to="/medicos" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" aria-hidden /> Profesionales</Link>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <Avatar name={`${d.firstName} ${d.lastName}`} size="xl" />
            <div className="flex-1">
              <h1 className="text-2xl font-bold tracking-tight">{d.title} {d.firstName} {d.lastName}</h1>
              <p className="font-medium text-primary">{sp?.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{d.license} · {d.years} años de experiencia</p>
            </div>
            <Link to="/reservar-turno" search={{ doctor: d.id }} className={buttonVariants({ size: "lg" })}>Reservar turno</Link>
          </div>
          <p className="mt-6 text-[15px] leading-relaxed text-foreground">{d.bio}</p>
          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
            <div className="flex items-center gap-2"><MapPin className="size-4 text-teal" aria-hidden /><dt className="sr-only">Consultorio</dt><dd>{L.roomName(d.roomId)} · Piso {L.room(d.roomId)?.floor}</dd></div>
            <div className="flex items-center gap-2"><Mail className="size-4 text-teal" aria-hidden /><dt className="sr-only">Correo</dt><dd className="truncate">{d.email}</dd></div>
            <div className="flex items-center gap-2"><Phone className="size-4 text-teal" aria-hidden /><dt className="sr-only">Teléfono</dt><dd>{d.phone}</dd></div>
          </dl>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader title="Horarios de atención" subtitle={`Turnos de ${sp?.duration ?? 30} min`} />
            <ul className="divide-y">
              {blocks.length === 0 && <li className="px-5 py-4 text-sm text-muted-foreground">Sin agenda configurada.</li>}
              {blocks.map((b) => (
                <li key={b.id} className="flex items-center justify-between px-5 py-3 text-sm"><span className="font-medium">{WEEKDAYS[b.weekday]}</span><span className="flex items-center gap-1.5 text-muted-foreground"><Clock className="size-4" aria-hidden />{b.start} – {b.end}</span></li>
              ))}
            </ul>
          </Card>
          <Card>
            <CardHeader title="Coberturas aceptadas" />
            <div className="flex flex-wrap gap-2 p-5">{d.insuranceIds.map((i) => <Tag key={i} tone="primary">{L.insuranceName(i)}</Tag>)}</div>
          </Card>
          <Link to="/medicos" search={{ especialidad: d.specialtyId }} className={cn(buttonVariants({ variant: "outline" }), "w-full")}>Otros profesionales de {sp?.name}</Link>
        </div>
      </div>
    </>
  );
}
