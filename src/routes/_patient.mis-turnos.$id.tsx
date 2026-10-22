import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, QrCode } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, Button, Card, EmptyState, Modal, StatusBadge, Textarea, buttonVariants } from "@/components/kit";
import { useLookup, useStore } from "@/lib/store";
import { canPatientCancel } from "@/lib/rules";
import { DEMO_PATIENT_ID } from "@/lib/mock-data";
import { fLong, fTime, pageHead } from "@/lib/format";

export const Route = createFileRoute("/_patient/mis-turnos/$id")({
  head: () => pageHead("Detalle del turno", "Detalle, QR y cancelación de tu turno en Salud Integral."),
  component: Detail,
});

function Detail() {
  const { id } = Route.useParams();
  const s = useStore();
  const L = useLookup();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const a = s.appointments.find((x) => x.id === id && x.patientId === DEMO_PATIENT_ID);
  if (!a) return <EmptyState title="Turno no encontrado" action={<Link to="/mis-turnos" className={buttonVariants()}>Mis turnos</Link>} />;
  const can = canPatientCancel(a, s.now, s.settings.cancelMinHours);
  const active = a.status === "Reservado" || a.status === "Confirmado";
  const cancel = () => {
    const r = s.setStatus(a.id, "Cancelado", reason.trim() || "Cancelado por el paciente");
    if (!r.ok) return void toast.error(r.error);
    s.notify("Turno cancelado", `${a.id} · la franja quedó disponible`, "paciente");
    s.notify("Cancelación online", `${a.id} · ${L.patientName(a.patientId)} canceló su turno`, "staff");
    toast.success("Turno cancelado");
    setOpen(false);
  };
  const room = L.room(a.roomId);
  return (
    <>
      <Link to="/mis-turnos" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" aria-hidden /> Mis turnos</Link>
      <Card className="max-w-2xl p-6">
        <div className="flex items-start justify-between gap-3">
          <div><p className="text-xs text-muted-foreground">Turno {a.id}</p><h1 className="text-2xl font-bold capitalize">{fLong(a.start)}</h1><p className="text-lg font-semibold text-primary">{fTime(a.start)} h · {a.duration} min</p></div>
          <StatusBadge status={a.status} />
        </div>
        <div className="mt-6 flex items-center gap-3 rounded-lg bg-muted p-4">
          <Avatar name={L.doctorName(a.doctorId)} />
          <div><p className="font-semibold">{L.doctorName(a.doctorId)}</p><p className="text-sm text-muted-foreground">{L.specialtyName(a.specialtyId)}</p></div>
          <Link to="/medicos/$id" params={{ id: a.doctorId }} className="ml-auto text-sm font-semibold text-primary hover:underline">Ver perfil</Link>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
          <div><dt className="text-xs text-muted-foreground">Consultorio</dt><dd className="font-medium">{room?.code} · Piso {room?.floor}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Cobertura</dt><dd className="font-medium">{L.insuranceName(a.insuranceId)}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Llegada</dt><dd className="font-medium">{a.arrivedAt ? `${fTime(a.arrivedAt)} h` : "Sin check-in"}</dd></div>
          <div><dt className="text-xs text-muted-foreground">Indicaciones</dt><dd className="font-medium">Llegá 15 min antes con tu DNI</dd></div>
        </dl>
        {a.status === "Cancelado" && a.cancellationReason && <p className="mt-4 rounded-lg bg-destructive-soft p-3 text-sm text-destructive">Motivo: {a.cancellationReason}</p>}
        {active && (
          <div className="mt-6 flex flex-wrap gap-2 border-t pt-5">
            <Link to="/qr/$id" params={{ id: a.id }} className={buttonVariants()}><QrCode aria-hidden /> Ver QR de check-in</Link>
            <Button variant="outline" onClick={() => (can.ok ? setOpen(true) : toast.error(can.reason))}>Cancelar turno</Button>
          </div>
        )}
      </Card>
      <Modal open={open} onOpenChange={setOpen} title="¿Cancelar este turno?" description={`${L.doctorName(a.doctorId)} · ${fLong(a.start)} ${fTime(a.start)} h`}
        footer={<><Button variant="outline" onClick={() => setOpen(false)}>Volver</Button><Button variant="danger" onClick={cancel}>Sí, cancelar</Button></>}>
        <label className="block text-sm font-medium">Motivo (opcional)<Textarea className="mt-1.5" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ej. no puedo asistir" /></label>
        <p className="mt-3 text-xs text-muted-foreground">La franja quedará disponible para otros pacientes.</p>
      </Modal>
    </>
  );
}
