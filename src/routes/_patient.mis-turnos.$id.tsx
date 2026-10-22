import { createFileRoute } from "@tanstack/react-router";
import { PageTitle, Card } from "@/components/kit";
import { pageHead } from "@/lib/format";

export const Route = createFileRoute("/_patient/mis-turnos/$id")({
  head: () => pageHead("Detalle del turno", "Detalle del turno — Centro Médico Salud Integral (demo)."),
  component: () => (
    <>
      <PageTitle title="Detalle del turno" subtitle="Pantalla en preparación para la demostración." />
      <Card className="p-8 text-sm text-muted-foreground">Esta sección todavía no está terminada.</Card>
    </>
  ),
});
