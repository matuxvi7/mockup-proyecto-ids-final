import { createFileRoute, Link } from "@tanstack/react-router";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Info } from "lucide-react";
import { Card, EmptyState, StatusBadge, buttonVariants } from "@/components/kit";
import { useLookup, useStore } from "@/lib/store";
import { DEMO_PATIENT_ID } from "@/lib/mock-data";
import { fLong, fTime, pageHead } from "@/lib/format";

export const Route = createFileRoute("/_patient/qr/$id")({
  head: () => pageHead("QR de check-in", "Mostrá este código en recepción para registrar tu llegada."),
  component: QR,
});

function QR() {
  const { id } = Route.useParams();
  const s = useStore();
  const L = useLookup();
  const a = s.appointments.find((x) => x.id === id && x.patientId === DEMO_PATIENT_ID);
  if (!a) return <EmptyState title="Turno no encontrado" action={<Link to="/mis-turnos" className={buttonVariants()}>Mis turnos</Link>} />;
  const usable = a.status === "Reservado" || a.status === "Confirmado";
  return (
    <div className="mx-auto max-w-sm">
      <Link to="/mis-turnos/$id" params={{ id: a.id }} className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" aria-hidden /> Detalle del turno</Link>
      <Card className="overflow-hidden text-center">
        <div className="bg-petrol px-6 py-5 text-petrol-foreground">
          <p className="text-sm opacity-80">Check-in digital</p>
          <p className="text-lg font-bold">{L.patientName(a.patientId)}</p>
        </div>
        <div className="p-6">
          <div className={usable ? "" : "opacity-25 grayscale"}>
            <QRCodeSVG value={`SALUDINTEGRAL:${a.id}`} size={220} className="mx-auto rounded-lg border bg-card p-3" />
          </div>
          <p className="mt-3 font-mono text-lg font-bold tracking-widest">{a.id}</p>
          <div className="mt-2"><StatusBadge status={a.status} /></div>
          <p className="mt-4 font-semibold">{L.doctorName(a.doctorId)}</p>
          <p className="text-sm text-muted-foreground capitalize">{fLong(a.start)} · {fTime(a.start)} h · {L.roomName(a.roomId)}</p>
          {a.arrivedAt && <p className="mt-3 rounded-lg bg-success-soft p-2 text-sm text-success-strong">Llegada registrada a las {fTime(a.arrivedAt)} h</p>}
          {!usable && <p className="mt-3 rounded-lg bg-warning-soft p-2 text-sm text-warning-foreground">Este código ya no es válido.</p>}
        </div>
        <p className="flex items-start gap-2 border-t bg-muted px-5 py-3 text-left text-xs text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0" aria-hidden /> Presentalo en recepción. En la demo, abrí el backoffice → Check-in e ingresá el código.</p>
      </Card>
    </div>
  );
}
