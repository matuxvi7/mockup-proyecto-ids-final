import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth-shell";
import { Button, Checkbox, Field, Input, Select } from "@/components/kit";
import { useStore } from "@/lib/store";
import { pageHead } from "@/lib/format";

export const Route = createFileRoute("/registro")({
  head: () => pageHead("Registro de pacientes", "Creá tu cuenta en el portal del paciente de Salud Integral (demo)."),
  component: Register,
});

type F = { firstName: string; lastName: string; dni: string; birth: string; email: string; phone: string; insuranceId: string; affiliate: string; pass: string };

function Register() {
  const s = useStore();
  const nav = useNavigate();
  const [f, setF] = useState<F>({ firstName: "", lastName: "", dni: "", birth: "", email: "", phone: "", insuranceId: "", affiliate: "", pass: "" });
  const [terms, setTerms] = useState(false);
  const [err, setErr] = useState<Partial<Record<keyof F | "terms", string>>>({});
  const set = (k: keyof F) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: typeof err = {};
    if (!f.firstName.trim()) er.firstName = "Requerido.";
    if (!f.lastName.trim()) er.lastName = "Requerido.";
    if (!/^\d{7,8}$/.test(f.dni)) er.dni = "DNI de 7 u 8 dígitos.";
    if (!f.birth) er.birth = "Requerido.";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = "Correo inválido.";
    if (f.phone.replace(/\D/g, "").length < 8) er.phone = "Teléfono inválido.";
    if (!f.insuranceId) er.insuranceId = "Elegí una cobertura.";
    if (f.pass.length < 8) er.pass = "Mínimo 8 caracteres.";
    if (!terms) er.terms = "Aceptá los términos.";
    setErr(er);
    if (Object.keys(er).length) return;
    const id = `pa-${crypto.randomUUID().slice(0, 6)}`;
    const { pass: _p, ...rest } = f;
    s.upsert("patients", { id, ...rest });
    s.notify("Nuevo paciente registrado", `${f.firstName} ${f.lastName} se registró en el portal`, "staff");
    toast.success("Cuenta creada", { description: "Registro simulado: no se envió ningún correo." });
    nav({ to: "/login" });
  };

  return (
    <AuthShell title="Crear cuenta" subtitle="Completá tus datos para reservar turnos online." footer={<>¿Ya tenés cuenta? <Link to="/login" className="font-semibold text-primary hover:underline">Iniciá sesión</Link></>}>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Nombre" error={err.firstName}><Input value={f.firstName} onChange={set("firstName")} aria-invalid={!!err.firstName} /></Field>
        <Field label="Apellido" error={err.lastName}><Input value={f.lastName} onChange={set("lastName")} aria-invalid={!!err.lastName} /></Field>
        <Field label="DNI" error={err.dni}><Input inputMode="numeric" value={f.dni} onChange={set("dni")} aria-invalid={!!err.dni} /></Field>
        <Field label="Fecha de nacimiento" error={err.birth}><Input type="date" value={f.birth} onChange={set("birth")} aria-invalid={!!err.birth} /></Field>
        <Field label="Correo electrónico" error={err.email} className="sm:col-span-2"><Input type="email" value={f.email} onChange={set("email")} aria-invalid={!!err.email} /></Field>
        <Field label="Teléfono" error={err.phone}><Input type="tel" value={f.phone} onChange={set("phone")} aria-invalid={!!err.phone} /></Field>
        <Field label="Cobertura médica" error={err.insuranceId}>
          <Select value={f.insuranceId} onChange={set("insuranceId")} aria-invalid={!!err.insuranceId}><option value="">Seleccionar…</option>{s.insurances.filter((i) => i.active).map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</Select>
        </Field>
        <Field label="N.º de afiliado" hint="Opcional para particulares"><Input value={f.affiliate} onChange={set("affiliate")} /></Field>
        <Field label="Contraseña" error={err.pass}><Input type="password" value={f.pass} onChange={set("pass")} aria-invalid={!!err.pass} /></Field>
        <div className="sm:col-span-2">
          <Checkbox checked={terms} onChange={setTerms} label="Acepto los términos y la política de privacidad" />
          {err.terms && <p role="alert" className="mt-1 text-xs font-medium text-destructive">{err.terms}</p>}
        </div>
        <Button type="submit" size="lg" className="sm:col-span-2">Crear cuenta</Button>
      </form>
    </AuthShell>
  );
}
