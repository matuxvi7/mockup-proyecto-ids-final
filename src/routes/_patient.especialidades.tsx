import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search } from "lucide-react";
import { SpecialtyIcon } from "@/components/brand";
import { Button, EmptyState, Input, PageTitle, buttonVariants } from "@/components/kit";
import { useStore } from "@/lib/store";
import { pageHead } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_patient/especialidades")({
  head: () => pageHead("Especialidades médicas", "Conocé las especialidades disponibles en Salud Integral y consultá disponibilidad."),
  component: Specialties,
});

function Specialties() {
  const s = useStore();
  const [q, setQ] = useState("");
  const list = s.specialties.filter((x) => x.active && x.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageTitle title="Especialidades" subtitle="Elegí un área de atención para ver profesionales y horarios." />
      <div className="relative mb-6 max-w-md">
        <Search className="absolute top-3.5 left-3 size-4 text-muted-foreground" aria-hidden />
        <Input aria-label="Buscar especialidad" placeholder="Buscar especialidad…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {list.length === 0 ? (
        <EmptyState title="Sin coincidencias" body="Probá con otro término." action={<Button variant="outline" onClick={() => setQ("")}>Limpiar búsqueda</Button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((x) => {
            const docs = s.doctors.filter((d) => d.active && d.specialtyId === x.id);
            return (
              <article key={x.id} className="flex flex-col rounded-xl border bg-card p-5 shadow-card">
                <div className="flex items-center gap-3">
                  <span className="flex size-11 items-center justify-center rounded-lg bg-primary-soft text-primary"><SpecialtyIcon icon={x.icon} /></span>
                  <div><h2 className="font-semibold">{x.name}</h2><p className="text-xs text-muted-foreground">{docs.length} profesionales · turnos de {x.duration} min</p></div>
                </div>
                <p className="mt-3 flex-1 text-sm text-muted-foreground">{x.description}</p>
                <div className="mt-5 flex gap-2">
                  <Link to="/medicos" search={{ especialidad: x.id }} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1")}>Ver profesionales</Link>
                  <Link to="/reservar-turno" search={{ specialty: x.id }} className={cn(buttonVariants({ size: "sm" }), "flex-1")}>Consultar disponibilidad</Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
