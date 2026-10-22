import { createFileRoute } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button, Card, CardHeader, Field, Input, Modal, PageTitle, Switch } from "@/components/kit";
import { useStore } from "@/lib/store";
import { pageHead } from "@/lib/format";
import type { Settings } from "@/lib/types";

export const Route = createFileRoute("/admin/configuracion")({
  head: () => pageHead("Configuración", "Parámetros operativos del centro médico (demo)."),
  component: Page,
});

function Page() {
  const s = useStore();
  const [f, setF] = useState<Settings>(s.settings);
  const [reset, setReset] = useState(false);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setF((x) => ({ ...x, [k]: v }));
  const save = () => {
    if (f.waitHigh <= f.waitModerate) return void toast.error("El umbral de espera prolongada debe superar al moderado.");
    if (!f.centerName.trim()) return void toast.error("Ingresá el nombre del centro.");
    s.updateSettings(f);
    toast.success("Configuración guardada", { description: "Operación demostrativa" });
  };
  const num = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) => set(k, Number(e.target.value) as never);

  return (
    <>
      <PageTitle title="Configuración" subtitle="Parámetros que afectan reservas, check-in y alertas de espera." action={<Button onClick={save}>Guardar cambios</Button>} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="General" />
          <div className="space-y-4 p-5">
            <Field label="Nombre del centro"><Input value={f.centerName} onChange={(e) => set("centerName", e.target.value)} /></Field>
            <Field label="Duración por defecto de turnos (min)"><Input type="number" min={5} value={f.defaultDuration} onChange={num("defaultDuration")} /></Field>
            <Row label="Reserva online habilitada" hint="Los pacientes pueden reservar desde el portal."><Switch label="Reserva online" checked={f.allowOnlineBooking} onChange={(v) => set("allowOnlineBooking", v)} /></Row>
            <Row label="Recordatorios automáticos" hint="Simulados: no se envían mensajes reales."><Switch label="Recordatorios" checked={f.reminders} onChange={(v) => set("reminders", v)} /></Row>
          </div>
        </Card>
        <Card>
          <CardHeader title="Turnos y sala de espera" />
          <div className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Cancelación mínima (horas)" hint="Anticipación para cancelar desde el portal"><Input type="number" min={0} value={f.cancelMinHours} onChange={num("cancelMinHours")} /></Field>
            <Field label="Ventana de check-in (min)" hint="Antes del horario del turno"><Input type="number" min={0} value={f.checkinWindowMinutes} onChange={num("checkinWindowMinutes")} /></Field>
            <Field label="Espera moderada desde (min)"><Input type="number" min={1} value={f.waitModerate} onChange={num("waitModerate")} /></Field>
            <Field label="Espera prolongada desde (min)"><Input type="number" min={1} value={f.waitHigh} onChange={num("waitHigh")} /></Field>
          </div>
        </Card>
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4 p-5">
            <div><p className="font-semibold">Restablecer demostración</p><p className="text-sm text-muted-foreground">Vuelve a generar todos los datos ficticios iniciales.</p></div>
            <Button variant="outline" onClick={() => setReset(true)}><RotateCcw aria-hidden /> Restablecer datos</Button>
          </div>
        </Card>
      </div>
      <Modal open={reset} onOpenChange={setReset} title="Restablecer datos de demo" description="Se perderán las reservas y cambios hechos en esta sesión." footer={<><Button variant="outline" onClick={() => setReset(false)}>Cancelar</Button><Button variant="danger" onClick={() => { s.resetDemo(); setReset(false); toast.success("Demo restablecida"); }}>Restablecer</Button></>} />
    </>
  );
}

function Row({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-4 rounded-lg border p-3"><div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{hint}</p></div>{children}</div>;
}
