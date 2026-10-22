import { createFileRoute } from "@tanstack/react-router";
import { PageTitle, Card } from "@/components/kit";
import { pageHead } from "@/lib/format";

export const Route = createFileRoute("/recuperar-password")({
  head: () => pageHead("Recuperar contraseña", "Recuperar contraseña — Centro Médico Salud Integral (demo)."),
  component: () => (
    <>
      <PageTitle title="Recuperar contraseña" subtitle="Pantalla en preparación para la demostración." />
      <Card className="p-8 text-sm text-muted-foreground">Esta sección todavía no está terminada.</Card>
    </>
  ),
});
