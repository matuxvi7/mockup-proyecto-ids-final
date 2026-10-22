import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, CheckCircle2, QrCode } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { SpecialtyIcon } from "@/components/brand";
import { Avatar, Button, Card, EmptyState, PageTitle, Select, buttonVariants } from "@/components/kit";
import { useLookup, useStore } from "@/lib/store";
import { DEMO_PATIENT_ID } from "@/lib/mock-data";
import { daySlots, workingDays } from "@/lib/slots";
import { fDate, fLong, fTime, pageHead } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_patient/reservar-turno")({
  head: () => pageHead("Reservar turno", "Reservá tu turno médico en pocos pasos: especialidad, profesional, fecha y horario."),
  validateSearch: (s: Record<string, unknown>): { specialty?: string; doctor?: string } => ({ specialty: typeof s.specialty === "string" ? s.specialty : undefined, doctor: typeof s.doctor === "string" ? s.doctor : undefined }),
  component: Booking,
});

const STEPS = ["Especialidad", "Profesional", "Fecha y hora", "Confirmar"];

function Booking() {
  const s = useStore();
  const L = useLookup();
  const search = Route.useSearch();
  const initDoc = search.doctor ? L.doctor(search.doctor) : undefined;
  const [sp, setSp] = useState(initDoc?.specialtyId ?? search.specialty ?? "");
  const [doc, setDoc] = useState(initDoc?.id ?? "");
  const [day, setDay] = useState<string>("");
  const [slot, setSlot] = useState<string>("");
  const [step, setStep] = useState(initDoc ? 2 : search.specialty ? 1 : 0);
  const [done, setDone] = useState<string | null>(null);
  const patient = L.patient(DEMO_PATIENT_ID)!;
  const [ins, setIns] = useState(patient.insuranceId);

  const days = useMemo(() => (doc ? workingDays(s.schedules, doc, s.now) : []), [doc, s.schedules, s.now]);
  const slots = useMemo(() => (doc && day ? daySlots(s.appointments, s.schedules, doc, new Date(day), s.now) : []), [doc, day, s.appointments, s.schedules, s.now]);
  const d = doc ? L.doctor(doc) : undefined;

  const confirm = () => {
    const r = s.bookAppointment({ patientId: DEMO_PATIENT_ID, doctorId: doc, start: new Date(slot), insuranceId: ins });
    if (!r.ok) { toast.error(r.error); setSlot(""); setStep(2); return; }
    s.notify("Turno reservado", `${r.id} · ${L.doctorName(doc)} · ${fDate(slot)} ${fTime(slot)}`, "paciente");
    s.notify("Nueva reserva online", `${r.id} · ${L.patientName(DEMO_PATIENT_ID)} con ${L.doctorName(doc)}`, "staff");
    setDone(r.id!);
  };

  if (done) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <span className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-success-soft text-success-strong"><CheckCircle2 className="size-8" aria-hidden /></span>
        <h1 className="text-2xl font-bold">¡Turno reservado!</h1>
        <p className="mt-1 text-sm text-muted-foreground">Código {done}. Te enviamos un recordatorio (simulado).</p>
        <div className="mt-6 rounded-lg bg-muted p-4 text-left text-sm">
          <p className="font-semibold">{L.doctorName(doc)}</p>
          <p className="text-primary">{L.specialtyName(sp)}</p>
          <p className="mt-2 capitalize-first">{fLong(slot)} · {fTime(slot)} h</p>
          <p className="text-muted-foreground">{d && L.roomName(d.roomId)} · {L.insuranceName(ins)}</p>
        </div>
        <div className="mt-6 flex gap-2">
          <Link to="/mis-turnos/$id" params={{ id: done }} className={cn(buttonVariants({ variant: "outline" }), "flex-1")}>Ver detalle</Link>
          <Link to="/qr/$id" params={{ id: done }} className={cn(buttonVariants(), "flex-1")}><QrCode aria-hidden /> Ver QR</Link>
        </div>
      </Card>
    );
  }

  return (
    <>
      <PageTitle title="Reservar turno" subtitle="Completá los pasos para confirmar tu reserva." />
      <ol className="mb-6 grid grid-cols-4 gap-2">
        {STEPS.map((t, i) => (
          <li key={t}>
            <button type="button" disabled={i > step} onClick={() => setStep(i)} className="w-full text-left">
              <span className={cn("block h-1.5 rounded-full", i <= step ? "bg-primary" : "bg-input")} />
              <span className={cn("mt-2 flex items-center gap-1 text-xs font-medium sm:text-sm", i === step ? "text-foreground" : "text-muted-foreground")}>{i < step && <Check className="size-3.5 text-primary" aria-hidden />}{t}</span>
            </button>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {s.specialties.filter((x) => x.active).map((x) => (
            <button key={x.id} onClick={() => { setSp(x.id); setDoc(""); setDay(""); setSlot(""); setStep(1); }} className={cn("rounded-xl border bg-card p-4 text-left shadow-card transition-colors hover:border-primary/50", sp === x.id && "border-primary ring-2 ring-primary/20")}>
              <span className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary"><SpecialtyIcon icon={x.icon} /></span>
              <p className="font-semibold">{x.name}</p>
              <p className="text-xs text-muted-foreground">{x.duration} min</p>
            </button>
          ))}
        </div>
      )}

      {step === 1 && (() => {
        const list = s.doctors.filter((x) => x.active && x.specialtyId === sp);
        return list.length === 0 ? <EmptyState title="Sin profesionales para esta especialidad" action={<Button variant="outline" onClick={() => setStep(0)}>Elegir otra</Button>} /> : (
          <div className="grid gap-3 md:grid-cols-2">
            {list.map((x) => (
              <button key={x.id} onClick={() => { setDoc(x.id); setDay(""); setSlot(""); setStep(2); }} className={cn("flex items-center gap-4 rounded-xl border bg-card p-4 text-left shadow-card hover:border-primary/50", doc === x.id && "border-primary ring-2 ring-primary/20")}>
                <Avatar name={`${x.firstName} ${x.lastName}`} />
                <div><p className="font-semibold">{x.title} {x.firstName} {x.lastName}</p><p className="text-sm text-muted-foreground">{L.roomName(x.roomId)} · {x.years} años de experiencia</p></div>
              </button>
            ))}
          </div>
        );
      })()}

      {step === 2 && d && (
        <Card className="p-5">
          <p className="mb-3 text-sm font-semibold">Fechas disponibles con {L.doctorName(d.id)}</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {days.map((x) => {
              const iso = x.toISOString();
              const free = daySlots(s.appointments, s.schedules, d.id, x, s.now).filter((z) => z.state === "libre").length;
              return (
                <button key={iso} disabled={!free} onClick={() => { setDay(iso); setSlot(""); }} className={cn("min-w-20 shrink-0 rounded-lg border px-3 py-2 text-center disabled:opacity-40", day === iso ? "border-primary bg-primary-soft text-petrol" : "bg-card hover:border-primary/50")}>
                  <span className="block text-xs capitalize">{fDate(x, "EEE")}</span>
                  <span className="block text-lg font-bold">{fDate(x, "d")}</span>
                  <span className="block text-[11px] text-muted-foreground">{free} libres</span>
                </button>
              );
            })}
          </div>
          {day ? (
            <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
              {slots.map((z) => {
                const iso = z.start.toISOString();
                return (
                  <button key={iso} disabled={z.state !== "libre"} onClick={() => setSlot(iso)} className={cn("rounded-lg border py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground disabled:line-through", slot === iso ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:border-primary/50")}>{fTime(z.start)}</button>
                );
              })}
            </div>
          ) : <p className="mt-4 text-sm text-muted-foreground">Elegí una fecha para ver los horarios.</p>}
          <div className="mt-6 flex justify-end"><Button disabled={!slot} onClick={() => setStep(3)}>Continuar</Button></div>
        </Card>
      )}

      {step === 3 && d && slot && (
        <Card className="max-w-xl p-6">
          <h2 className="text-lg font-semibold">Revisá tu turno</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-xs text-muted-foreground">Profesional</dt><dd className="font-medium">{L.doctorName(d.id)}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Especialidad</dt><dd className="font-medium">{L.specialtyName(sp)}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Fecha</dt><dd className="font-medium capitalize">{fLong(slot)}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Hora</dt><dd className="font-medium">{fTime(slot)} h</dd></div>
            <div><dt className="text-xs text-muted-foreground">Consultorio</dt><dd className="font-medium">{L.roomName(d.roomId)}</dd></div>
            <div><dt className="text-xs text-muted-foreground">Paciente</dt><dd className="font-medium">{L.patientName(DEMO_PATIENT_ID)}</dd></div>
          </dl>
          <label className="mt-5 block text-sm font-medium">Cobertura
            <Select className="mt-1.5" value={ins} onChange={(e) => setIns(e.target.value)}>
              {s.insurances.filter((i) => d.insuranceIds.includes(i.id) || i.type === "Particular").map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
            </Select>
          </label>
          {!d.insuranceIds.includes(patient.insuranceId) && <p className="mt-2 rounded-lg bg-warning-soft p-2 text-xs text-warning-foreground">Este profesional no atiende por tu cobertura principal.</p>}
          <div className="mt-6 flex justify-between gap-2"><Button variant="outline" onClick={() => setStep(2)}>Volver</Button><Button onClick={confirm}>Confirmar reserva</Button></div>
        </Card>
      )}
    </>
  );
}
