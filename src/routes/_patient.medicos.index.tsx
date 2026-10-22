import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Button, EmptyState, Field, Input, PageTitle, Select } from "@/components/kit";
import { DoctorCard } from "@/components/shared";
import { useStore } from "@/lib/store";
import { pageHead, WEEKDAYS } from "@/lib/format";

export const Route = createFileRoute("/_patient/medicos/")({
  head: () => pageHead("Profesionales", "Buscá médicos por especialidad, nombre y día de atención en Salud Integral."),
  validateSearch: (s: Record<string, unknown>): { especialidad?: string; q?: string; dia?: string } => ({ especialidad: typeof s.especialidad === "string" ? s.especialidad : undefined, q: typeof s.q === "string" ? s.q : undefined, dia: typeof s.dia === "string" ? s.dia : undefined }),
  component: Doctors,
});

function Doctors() {
  const s = useStore();
  const { especialidad, q, dia } = Route.useSearch();
  const nav = useNavigate({ from: "/medicos/" });
  const upd = (p: Partial<{ especialidad: string; q: string; dia: string }>) =>
    nav({ search: (old) => ({ ...old, ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v || undefined])) }), replace: true });
  const list = s.doctors.filter((d) => {
    if (!d.active) return false;
    if (especialidad && d.specialtyId !== especialidad) return false;
    if (q && !`${d.firstName} ${d.lastName}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (dia && !s.schedules.some((b) => b.doctorId === d.id && b.weekday === +dia)) return false;
    return true;
  });
  return (
    <>
      <PageTitle title="Profesionales" subtitle={`${list.length} profesional${list.length !== 1 ? "es" : ""} disponibles`} />
      <div className="mb-6 grid gap-3 rounded-xl border bg-card p-4 shadow-card sm:grid-cols-3">
        <Field label="Buscar por nombre">
          <div className="relative"><Search className="absolute top-3.5 left-3 size-4 text-muted-foreground" aria-hidden /><Input className="pl-9" placeholder="Ej. Gómez" value={q ?? ""} onChange={(e) => upd({ q: e.target.value })} /></div>
        </Field>
        <Field label="Especialidad"><Select value={especialidad ?? ""} onChange={(e) => upd({ especialidad: e.target.value })}><option value="">Todas</option>{s.specialties.filter((x) => x.active).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select></Field>
        <Field label="Día de atención"><Select value={dia ?? ""} onChange={(e) => upd({ dia: e.target.value })}><option value="">Cualquier día</option>{[1, 2, 3, 4, 5, 6].map((d) => <option key={d} value={d}>{WEEKDAYS[d]}</option>)}</Select></Field>
      </div>
      {list.length === 0 ? (
        <EmptyState title="No encontramos profesionales" body="Probá quitando algún filtro." action={<Button variant="outline" onClick={() => nav({ search: {} })}>Limpiar filtros</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{list.map((d) => <DoctorCard key={d.id} d={d} />)}</div>
      )}
    </>
  );
}
