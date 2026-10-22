import { createFileRoute, Link } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { useState } from "react";
import { AuthShell } from "@/components/auth-shell";
import { Button, Field, Input, buttonVariants } from "@/components/kit";
import { pageHead } from "@/lib/format";

export const Route = createFileRoute("/recuperar-password")({
  head: () => pageHead("Recuperar contraseña", "Recuperá el acceso a tu cuenta de Salud Integral (demo)."),
  component: Recover,
});

function Recover() {
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <AuthShell title="Recuperar contraseña" subtitle="Te enviaremos un enlace para crear una nueva contraseña." footer={<Link to="/login" className="font-semibold text-primary hover:underline">← Volver a iniciar sesión</Link>}>
      {sent ? (
        <div className="rounded-xl border bg-card p-6 text-center shadow-card">
          <span className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-success-soft text-success-strong"><MailCheck className="size-6" aria-hidden /></span>
          <p className="font-semibold">Revisá tu correo</p>
          <p className="mt-1 text-sm text-muted-foreground">Si <strong>{email}</strong> está registrado, recibirás las instrucciones. (Simulado: no se envió ningún correo.)</p>
          <Link to="/login" className={buttonVariants({ className: "mt-5" })}>Ir a iniciar sesión</Link>
        </div>
      ) : (
        <form noValidate className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Ingresá un correo válido."); setErr(""); setSent(true); }}>
          <Field label="Correo electrónico" error={err}><Input type="email" value={email} aria-invalid={!!err} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Button type="submit" size="lg" className="w-full">Enviar enlace</Button>
        </form>
      )}
    </AuthShell>
  );
}
