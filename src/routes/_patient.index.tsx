import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, CalendarCheck, CalendarPlus, QrCode, Search, Smartphone, UserCheck } from "lucide-react";
import { useState } from "react";
import { parseISO } from "date-fns";
import { SpecialtyIcon } from "@/components/brand";
import { Avatar, Button, Card, EmptyState, Field, Input, Select, StatusBadge, buttonVariants } from "@/components/kit";
import { DoctorCard } from "@/components/shared";
import { useLookup, useStore } from "@/lib/store";
import { DEMO_PATIENT_ID } from "@/lib/mock-data";
import { fLong, fTime, pageHead } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_patient/")({
  head: () => pageHead("Turnos médicos online", "Encontrá especialistas, reservá tus turnos y organizá tu atención médica desde un solo lugar."),
  component: Home,
});

function Home() {
  const s = useStore();
  const L = useLookup();
  const nav = useNavigate();
  const [sp, setSp] = useState("");
  const [doc, setDoc] = useState("");
  const [day, setDay] = useState("");
  const next = s.appointments
    .filter((a) => a.patientId === DEMO_PATIENT_ID && ["Reservado", "Confirmado"].includes(a.status) && parseISO(a.start) > s.now)
    .sort((a, b) => a.start.localeCompare(b.start))[0];
  const docs = s.doctors.filter((d) => d.active && (!sp || d.specialtyId === sp));

  return (
    <div className="space-y-14">
      <section className="bg-hero overflow-hidden rounded-2xl border px-6 py-10 shadow-card sm:px-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr] lg:items-center">
          <div>
            <p className="mb-3 text-sm font-semibold text-teal">Centro Médico Salud Integral</p>
            <h1 className="text-[34px] leading-[1.1] font-extrabold tracking-tight text-petrol sm:text-[42px]">Tu salud, más cerca que nunca</h1>
            <p className="mt-4 max-w-lg text-[16px] text-muted-foreground">Encontrá especialistas, reservá tus turnos y organizá tu atención médica desde un solo lugar.</p>
            <form
              onSubmit={(e) => { e.preventDefault(); nav({ to: "/medicos", search: { especialidad: sp || undefined, q: doc || undefined, dia: day || undefined } }); }}
              className="mt-8 grid gap-3 rounded-xl border bg-card p-3 shadow-card sm:grid-cols-[1fr_1fr_0.8fr_auto]"
            >
              <Field label="Especialidad"><Select value={sp} onChange={(e) => { setSp(e.target.value); setDoc(""); }}><option value="">Todas</option>{s.specialties.filter((x) => x.active).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select></Field>
              <Field label="Profesional"><Select value={doc} onChange={(e) => setDoc(e.target.value)}><option value="">Cualquiera</option>{docs.map((d) => <option key={d.id} value={d.lastName}>{d.title} {d.lastName}</option>)}</Select></Field>
              <Field label="Día preferido"><Select value={day} onChange={(e) => setDay(e.target.value)}><option value="">Cualquier día</option>{["1","2","3","4","5","6"].map((d) => <option key={d} value={d}>{["","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"][+d]}</option>)}</Select></Field>
              <Button type="submit" size="lg" className="self-end"><Search aria-hidden /> Buscar turnos</Button>
            </form>
          </div>
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Próximo turno</h2>
              {next && <StatusBadge status={next.status} />}
            </div>
            {next ? (
              <>
                <div className="flex items-center gap-3">
                  <Avatar name={L.doctorName(next.doctorId)} size="lg" />
                  <div><p className="font-semibold">{L.doctorName(next.doctorId)}</p><p className="text-sm text-primary">{L.specialtyName(next.specialtyId)}</p></div>
                </div>
                <dl className="mt-5 grid grid-cols-3 gap-3 rounded-lg bg-muted p-3 text-sm">
                  <div><dt className="text-xs text-muted-foreground">Fecha</dt><dd className="font-semibold capitalize">{fLong(next.start).split(" ").slice(0, 2).join(" ")}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Hora</dt><dd className="font-semibold">{fTime(next.start)}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Lugar</dt><dd className="font-semibold">{L.roomName(next.roomId).replace("Consultorio", "Cons.")}</dd></div>
                </dl>
                <div className="mt-5 flex gap-2">
                  <Link to="/mis-turnos/$id" params={{ id: next.id }} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1")}>Ver detalle</Link>
                  <Link to="/qr/$id" params={{ id: next.id }} className={cn(buttonVariants({ size: "sm" }), "flex-1")}><QrCode aria-hidden /> Ver QR</Link>
                </div>
              </>
            ) : (
              <EmptyState icon={<CalendarPlus className="size-6" />} title="No tenés turnos próximos" body="Reservá en pocos pasos con el profesional que prefieras." action={<Link to="/reservar-turno" className={buttonVariants({ size: "sm" })}>Reservar turno</Link>} />
            )}
          </Card>
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-[22px] font-bold tracking-tight">Especialidades destacadas</h2>
          <Link to="/especialidades" className="text-sm font-semibold text-primary hover:underline">Ver todas</Link>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {s.specialties.filter((x) => x.active).map((x) => {
            const n = s.doctors.filter((d) => d.active && d.specialtyId === x.id).length;
            return (
              <Link key={x.id} to="/reservar-turno" search={{ specialty: x.id }} className="group rounded-xl border bg-card p-4 shadow-card transition-colors hover:border-primary/40">
                <span className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary-soft text-primary"><SpecialtyIcon icon={x.icon} /></span>
                <p className="font-semibold">{x.name}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{x.description}</p>
                <p className="mt-3 flex items-center justify-between text-xs font-medium text-teal">{n} profesional{n !== 1 && "es"} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden /></p>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-[22px] font-bold tracking-tight">Profesionales destacados</h2>
          <Link to="/medicos" className="text-sm font-semibold text-primary hover:underline">Ver profesionales</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">{s.doctors.slice(0, 3).map((d) => <DoctorCard key={d.id} d={d} />)}</div>
      </section>

      <section className="rounded-2xl bg-petrol px-6 py-10 text-petrol-foreground sm:px-10">
        <h2 className="text-[22px] font-bold">Check-in digital, sin filas</h2>
        <p className="mt-1 max-w-xl text-sm opacity-80">Presentá el código QR de tu turno en recepción y quedás registrado en la sala de espera.</p>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          {[
            { i: CalendarCheck, t: "Reservá tu turno", b: "Elegí especialidad, profesional y horario." },
            { i: Smartphone, t: "Abrí tu QR", b: "Lo encontrás en Mis turnos, listo para mostrar." },
            { i: UserCheck, t: "Registrá tu llegada", b: "Recepción escanea el código y te asigna lugar en la cola." },
          ].map((x, k) => (
            <li key={x.t} className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-teal text-sm font-bold">{k + 1}</span>
              <div><p className="flex items-center gap-2 font-semibold"><x.i className="size-4" aria-hidden />{x.t}</p><p className="mt-1 text-sm opacity-75">{x.b}</p></div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
