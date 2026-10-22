import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth-shell";
import { Button, Field, Input, Segmented } from "@/components/kit";
import { useStore } from "@/lib/store";
import { pageHead } from "@/lib/format";

export const Route = createFileRoute("/login")({
  head: () => pageHead("Iniciar sesión", "Ingresá al portal del paciente o al backoffice de Salud Integral (demo)."),
  component: Login,
});

function Login() {
  const s = useStore();
  const nav = useNavigate();
  const [role, setRole] = useState<"paciente" | "recepcion" | "admin">("paciente");
  const [email, setEmail] = useState("lucia.fernandez@demo.com");
  const [pass, setPass] = useState("demo1234");
  const [err, setErr] = useState<{ email?: string; pass?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: typeof err = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) er.email = "Ingresá un correo válido.";
    if (pass.length < 6) er.pass = "La contraseña debe tener al menos 6 caracteres.";
    setErr(er);
    if (Object.keys(er).length) return;
    setLoading(true);
    setTimeout(() => {
      s.setRole(role);
      toast.success("Sesión iniciada", { description: "Acceso simulado de demostración" });
      nav({ to: role === "paciente" ? "/" : "/admin" });
    }, 600);
  };

  return (
    <AuthShell title="Iniciar sesión" subtitle="Elegí con qué perfil querés ingresar a la demo." footer={<>¿No tenés cuenta? <Link to="/registro" className="font-semibold text-primary hover:underline">Registrate</Link></>}>
      <div className="mb-5">
        <Segmented value={role} onChange={(v) => { setRole(v); setEmail(v === "paciente" ? "lucia.fernandez@demo.com" : v === "recepcion" ? "recepcion@saludintegral.demo" : "admin@saludintegral.demo"); }} options={[{ value: "paciente", label: "Paciente" }, { value: "recepcion", label: "Recepción" }, { value: "admin", label: "Administración" }]} />
      </div>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Correo electrónico" error={err.email}><Input type="email" value={email} aria-invalid={!!err.email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <Field label="Contraseña" error={err.pass}><Input type="password" value={pass} aria-invalid={!!err.pass} onChange={(e) => setPass(e.target.value)} /></Field>
        <div className="text-right text-sm"><Link to="/recuperar-password" className="font-medium text-primary hover:underline">¿Olvidaste tu contraseña?</Link></div>
        <Button type="submit" size="lg" className="w-full" disabled={loading}>{loading ? "Ingresando…" : "Ingresar"}</Button>
      </form>
    </AuthShell>
  );
}
