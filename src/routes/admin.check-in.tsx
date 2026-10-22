import { createFileRoute, Link } from "@tanstack/react-router";
import { isSameDay, parseISO } from "date-fns";
import { CheckCircle2, QrCode, ScanLine, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button, Card, CardHeader, Field, Input, PageTitle, buttonVariants } from "@/components/kit";
import { useLookup, useStore } from "@/lib/store";
import { checkInEligibility } from "@/lib/rules";
import { fLong, fTime, pageHead } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/check-in")({
  head: () => pageHead("Check-in QR", "Registro de llegada mediante escáner QR simulado (demo)."),
  component: Page,
});

type Res = { ok: boolean; id: string; message: string } | null;

function Page() {
  const s = useStore();
  const L = useLookup();
  const [code, setCode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [res, setRes] = useState<Res>(null);
  const candidates = s.appointments.filter((a) => isSameDay(parseISO(a.start), s.now) && !a.arrivedAt && (a.status === "Reservado" || a.status === "Confirmado"));

  const process = (raw: string) => {
    const id = raw.trim().toUpperCase();
    const a = s.appointments.find((x) => x.id === id);
    if (!a) return setRes({ ok: false, id, message: "Código no reconocido. Verificá el turno con el paciente." });
    const e = checkInEligibility(a, s.now);
    if (!e.ok) return setRes({ ok: false, id, message: e.message });
    s.checkIn(a.id);
    s.notify("Llegada registrada", `${L.patientName(a.patientId)} · ${L.doctorName(a.doctorId)}`, "staff");
    toast.success("Simulación completada", { description: "Paciente agregado a la sala de espera" });
    setRes({ ok: true, id, message: `${L.patientName(a.patientId)} — ${L.doctorName(a.doctorId)} a las ${fTime(a.start)} (${L.roomName(a.roomId)}).` });
    setCode("");
  };

  const simulateScan = () => {
    setRes(null);
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      const pick = candidates[Math.floor(Math.random() * candidates.length)];
      if (!pick) return setRes({ ok: false, id: "—", message: "No quedan turnos de hoy pendientes de llegada." });
      process(pick.id);
    }, 1400);
  };

  const a = res && s.appointments.find((x) => x.id === res.id);

  return (
    <>
      <PageTitle title="Check-in QR" subtitle="Escáner simulado. No se accede a la cámara del dispositivo." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="relative mx-auto flex aspect-square max-w-sm items-center justify-center overflow-hidden rounded-2xl bg-petrol">
            <div className="absolute inset-8 rounded-xl border-2 border-dashed border-petrol-foreground/40" />
            {scanning ? (
              <>
                <QrCode className="size-32 text-petrol-foreground/60" aria-hidden />
                <div className="scan-line absolute inset-x-8 h-0.5 bg-teal shadow-pop" />
              </>
            ) : (
              <ScanLine className="size-20 text-petrol-foreground/70" aria-hidden />
            )}
            <p className="absolute bottom-4 text-xs font-medium text-petrol-foreground/80">{scanning ? "Leyendo código…" : "Cámara simulada"}</p>
          </div>
          <Button className="mt-6 w-full" size="lg" onClick={simulateScan} disabled={scanning}><ScanLine aria-hidden /> Simular lectura de QR</Button>
          <form onSubmit={(e) => { e.preventDefault(); if (code) process(code); }} className="mt-6 flex items-end gap-2">
            <Field label="O ingresá el código del turno" className="flex-1"><Input placeholder="SI-24001" value={code} onChange={(e) => setCode(e.target.value)} /></Field>
            <Button type="submit" variant="outline" disabled={!code}>Validar</Button>
          </form>
        </Card>
        <div className="space-y-6">
          {res && (
            <Card className={cn("p-6", res.ok ? "border-success" : "border-destructive")}>
              <div className="flex gap-4">
                {res.ok ? <CheckCircle2 className="size-10 shrink-0 text-success" aria-hidden /> : <XCircle className="size-10 shrink-0 text-destructive" aria-hidden />}
                <div>
                  <p className="text-lg font-semibold">{res.ok ? "Llegada registrada" : "No se pudo registrar"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{res.message}</p>
                  {a && <p className="mt-2 font-mono text-xs text-muted-foreground">{a.id} · {fLong(a.start)}</p>}
                  {res.ok && <Link to="/admin/sala-espera" className={cn(buttonVariants({ size: "sm", variant: "soft" }), "mt-4")}>Ver sala de espera</Link>}
                </div>
              </div>
            </Card>
          )}
          <Card>
            <CardHeader title="Pendientes de llegada hoy" subtitle="Hacé clic para registrar manualmente" />
            <ul className="max-h-96 divide-y overflow-y-auto">
              {candidates.sort((x, y) => x.start.localeCompare(y.start)).map((x) => (
                <li key={x.id}>
                  <button onClick={() => process(x.id)} className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-muted/50">
                    <span className="w-12 font-mono text-sm font-semibold">{fTime(x.start)}</span>
                    <span className="flex-1 text-sm">{L.patientName(x.patientId)}<span className="block text-xs text-muted-foreground">{L.doctorName(x.doctorId)}</span></span>
                    <span className="font-mono text-xs text-muted-foreground">{x.id}</span>
                  </button>
                </li>
              ))}
              {!candidates.length && <li className="px-5 py-6 text-sm text-muted-foreground">No quedan turnos pendientes.</li>}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
