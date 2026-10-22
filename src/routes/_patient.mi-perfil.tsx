import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Avatar, Button, Card, CardHeader, Field, Input, PageTitle, Select, Switch } from "@/components/kit";
import { useLookup, useStore } from "@/lib/store";
import { DEMO_PATIENT_ID } from "@/lib/mock-data";
import { pageHead } from "@/lib/format";
import type { Patient } from "@/lib/types";

export const Route = createFileRoute("/_patient/mi-perfil")({
  head: () => pageHead("Mi perfil", "Datos personales y cobertura médica del paciente en Salud Integral."),
  component: Profile,
});

function Profile() {
  const s = useStore();
  const L = useLookup();
  const p = L.patient(DEMO_PATIENT_ID)!;
  const [f, setF] = useState<Patient>(p);
  const [prefs, setPrefs] = useState({ email: true, sms: false, whatsapp: true });
  useEffect(() => setF(p), [p]);
  const set = (k: keyof Patient) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.firstName.trim() || !f.lastName.trim()) return void toast.error("Nombre y apellido son obligatorios.");
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return void toast.error("Correo inválido.");
    s.upsert("patients", f);
    toast.success("Datos actualizados", { description: "Cambios guardados en la demo" });
  };
  const ins = s.insurances.find((i) => i.id === f.insuranceId);
  return (
    <>
      <PageTitle title="Mi perfil" subtitle="Mantené tus datos al día para agilizar la atención." />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <form onSubmit={save}>
          <Card>
            <CardHeader title="Datos personales" />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Nombre"><Input value={f.firstName} onChange={set("firstName")} /></Field>
              <Field label="Apellido"><Input value={f.lastName} onChange={set("lastName")} /></Field>
              <Field label="DNI" hint="No editable"><Input value={f.dni} disabled /></Field>
              <Field label="Fecha de nacimiento"><Input type="date" value={f.birth} onChange={set("birth")} /></Field>
              <Field label="Correo"><Input type="email" value={f.email} onChange={set("email")} /></Field>
              <Field label="Teléfono"><Input value={f.phone} onChange={set("phone")} /></Field>
            </div>
            <CardHeader title="Cobertura médica" />
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <Field label="Cobertura"><Select value={f.insuranceId} onChange={set("insuranceId")}>{s.insurances.filter((i) => i.active).map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</Select></Field>
              <Field label="N.º de afiliado"><Input value={f.affiliate} onChange={set("affiliate")} /></Field>
            </div>
            <div className="flex justify-end gap-2 border-t px-5 py-4"><Button type="button" variant="outline" onClick={() => setF(p)}>Descartar</Button><Button type="submit">Guardar cambios</Button></div>
          </Card>
        </form>
        <div className="space-y-6">
          <Card className="p-5 text-center">
            <div className="flex justify-center"><Avatar name={`${p.firstName} ${p.lastName}`} size="xl" tone="teal" /></div>
            <p className="mt-3 font-semibold">{p.firstName} {p.lastName}</p>
            <p className="text-sm text-muted-foreground">DNI {p.dni}</p>
            <div className="mt-4 rounded-xl bg-petrol p-4 text-left text-petrol-foreground">
              <p className="flex items-center gap-2 text-xs opacity-80"><ShieldCheck className="size-4" aria-hidden /> Credencial digital</p>
              <p className="mt-2 font-bold">{ins?.name}</p>
              <p className="font-mono text-sm opacity-90">{p.affiliate || "—"}</p>
            </div>
          </Card>
          <Card>
            <CardHeader title="Recordatorios" />
            <ul className="divide-y">
              {([["email", "Correo electrónico"], ["sms", "SMS"], ["whatsapp", "WhatsApp"]] as const).map(([k, l]) => (
                <li key={k} className="flex items-center justify-between px-5 py-3 text-sm">{l}<Switch label={l} checked={prefs[k]} onChange={(v) => { setPrefs({ ...prefs, [k]: v }); toast(`${l}: ${v ? "activado" : "desactivado"}`); }} /></li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
