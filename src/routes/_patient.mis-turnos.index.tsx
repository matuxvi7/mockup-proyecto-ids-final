import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarPlus, QrCode } from "lucide-react";
import { useState } from "react";
import { parseISO } from "date-fns";
import { Avatar, Card, EmptyState, PageTitle, Segmented, StatusBadge, buttonVariants } from "@/components/kit";
import { useLookup, useStore } from "@/lib/store";
import { DEMO_PATIENT_ID } from "@/lib/mock-data";
import { fLong, fTime, pageHead } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_patient/mis-turnos/")({
  head: () => pageHead("Mis turnos", "Consultá tus próximos turnos y el historial de atención en Salud Integral."),
  component: MyAppointments,
});

function MyAppointments() {
  const s = useStore();
  const L = useLookup();
  const [tab, setTab] = useState<"proximos" | "historial">("proximos");
  const mine = s.appointments.filter((a) => a.patientId === DEMO_PATIENT_ID);
  const upcoming = mine.filter((a) => ["Reservado", "Confirmado"].includes(a.status) && parseISO(a.start).getTime() + a.duration * 60000 > s.now.getTime()).sort((a, b) => a.start.localeCompare(b.start));
  const history = mine.filter((a) => !upcoming.includes(a)).sort((a, b) => b.start.localeCompare(a.start));
  const list = tab === "proximos" ? upcoming : history;
  return (
    <>
      <PageTitle title="Mis turnos" action={<Link to="/reservar-turno" className={buttonVariants()}><CalendarPlus aria-hidden /> Nuevo turno</Link>} />
      <div className="mb-5"><Segmented value={tab} onChange={setTab} options={[{ value: "proximos", label: "Próximos", count: upcoming.length }, { value: "historial", label: "Historial", count: history.length }]} /></div>
      {list.length === 0 ? (
        <Card><EmptyState title={tab === "proximos" ? "No tenés turnos próximos" : "Todavía no hay historial"} action={tab === "proximos" ? <Link to="/reservar-turno" className={buttonVariants({ size: "sm" })}>Reservar turno</Link> : undefined} /></Card>
      ) : (
        <ul className="space-y-3">
          {list.map((a) => (
            <li key={a.id}>
              <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="flex w-20 shrink-0 flex-col items-center rounded-lg bg-primary-soft py-2 text-petrol">
                  <span className="text-xs capitalize">{fLong(a.start).split(" ")[0]}</span>
                  <span className="text-xl font-bold">{fTime(a.start)}</span>
                </div>
                <div className="flex flex-1 items-center gap-3">
                  <Avatar name={L.doctorName(a.doctorId)} size="sm" />
                  <div>
                    <p className="font-semibold">{L.doctorName(a.doctorId)}</p>
                    <p className="text-sm text-muted-foreground">{L.specialtyName(a.specialtyId)} · {fLong(a.start)}</p>
                  </div>
                </div>
                <StatusBadge status={a.status} />
                <div className="flex gap-2">
                  <Link to="/mis-turnos/$id" params={{ id: a.id }} className={buttonVariants({ variant: "outline", size: "sm" })}>Detalle</Link>
                  {tab === "proximos" && <Link to="/qr/$id" params={{ id: a.id }} className={cn(buttonVariants({ size: "sm" }))}><QrCode aria-hidden /> QR</Link>}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
