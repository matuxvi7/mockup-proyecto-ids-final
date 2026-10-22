import { createFileRoute } from "@tanstack/react-router";
import { PageTitle, Card } from "@/components/kit";
import { pageHead } from "@/lib/format";

export const Route = createFileRoute("/_patient/qr/$id")({
  head: () => pageHead("QR de check-in", "QR de check-in — Centro Médico Salud Integral (demo)."),
  component: () => (
    <>
      <PageTitle title="QR de check-in" subtitle="Pantalla en preparación para la demostración." />
      <Card className="p-8 text-sm text-muted-foreground">Esta sección todavía no está terminada.</Card>
    </>
  ),
});
