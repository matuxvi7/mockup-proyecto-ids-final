import { createFileRoute } from "@tanstack/react-router";
import { PageTitle, Card } from "@/components/kit";
import { pageHead } from "@/lib/format";

export const Route = createFileRoute("/_patient/medicos/")({
  head: () => pageHead("Profesionales", "Profesionales — Centro Médico Salud Integral (demo)."),
  validateSearch: (s: Record<string, unknown>): {especialidad?: string; q?: string; dia?: string} => ({especialidad: typeof s.especialidad === "string" ? s.especialidad : undefined, q: typeof s.q === "string" ? s.q : undefined, dia: typeof s.dia === "string" ? s.dia : undefined}),
  component: () => (
    <>
      <PageTitle title="Profesionales" subtitle="Pantalla en preparación para la demostración." />
      <Card className="p-8 text-sm text-muted-foreground">Esta sección todavía no está terminada.</Card>
    </>
  ),
});
