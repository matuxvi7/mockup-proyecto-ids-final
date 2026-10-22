import { createFileRoute } from "@tanstack/react-router";
import { PageTitle, Card } from "@/components/kit";
import { pageHead } from "@/lib/format";

export const Route = createFileRoute("/login")({
  head: () => pageHead("Iniciar sesión", "Iniciar sesión — Centro Médico Salud Integral (demo)."),
  component: () => (
    <>
      <PageTitle title="Iniciar sesión" subtitle="Pantalla en preparación para la demostración." />
      <Card className="p-8 text-sm text-muted-foreground">Esta sección todavía no está terminada.</Card>
    </>
  ),
});
