import { createFileRoute } from "@tanstack/react-router";
import { PageTitle, Card } from "@/components/kit";
import { pageHead } from "@/lib/format";

export const Route = createFileRoute("/_patient/reservar-turno")({
  head: () => pageHead("Reservar turno", "Reservar turno — Centro Médico Salud Integral (demo)."),
  validateSearch: (s: Record<string, unknown>): {specialty?: string; doctor?: string} => ({specialty: typeof s.specialty === "string" ? s.specialty : undefined, doctor: typeof s.doctor === "string" ? s.doctor : undefined}),
  component: () => (
    <>
      <PageTitle title="Reservar turno" subtitle="Pantalla en preparación para la demostración." />
      <Card className="p-8 text-sm text-muted-foreground">Esta sección todavía no está terminada.</Card>
    </>
  ),
});
