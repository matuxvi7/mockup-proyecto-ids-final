import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { LayoutDashboard, LogOut, Menu, Search, User, X } from "lucide-react";
import { useState } from "react";
import { DemoBadge, Logo } from "@/components/brand";
import { Avatar, buttonVariants } from "@/components/kit";
import { NotificationBell } from "@/components/shared";
import { useLookup, useStore } from "@/lib/store";
import { DEMO_PATIENT_ID } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_patient")({ component: PatientLayout });

const NAV = [
  { to: "/", label: "Inicio" },
  { to: "/especialidades", label: "Especialidades" },
  { to: "/medicos", label: "Profesionales" },
  { to: "/mis-turnos", label: "Mis turnos" },
] as const;

function PatientLayout() {
  const s = useStore();
  const L = useLookup();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const path = useRouterState({ select: (r) => r.location.pathname });
  const name = L.patientName(DEMO_PATIENT_ID);
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
          <Logo />
          <nav className="hidden flex-1 items-center gap-1 md:flex" aria-label="Principal">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/" }} className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground data-[status=active]:bg-primary-soft data-[status=active]:text-petrol">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <Link to="/medicos" className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}>
              <Search aria-hidden /> Buscar médicos
            </Link>
            <NotificationBell audience="paciente" />
            <Dropdown.Root>
              <Dropdown.Trigger className="rounded-full p-0.5 hover:ring-2 hover:ring-primary/20" aria-label="Menú de perfil">
                <Avatar name={name} size="sm" tone="teal" />
              </Dropdown.Trigger>
              <Dropdown.Portal>
                <Dropdown.Content align="end" sideOffset={8} className="z-50 w-56 rounded-xl border bg-popover p-1 shadow-pop animate-in fade-in-0">
                  <div className="px-3 py-2"><p className="text-sm font-semibold">{name}</p><p className="text-xs text-muted-foreground">Paciente demo</p></div>
                  <Dropdown.Separator className="my-1 h-px bg-border" />
                  {[
                    { icon: User, label: "Mi perfil", to: "/mi-perfil" as const },
                    { icon: LayoutDashboard, label: "Ir al backoffice", to: "/admin" as const },
                    { icon: LogOut, label: "Cerrar sesión", to: "/login" as const },
                  ].map((i) => (
                    <Dropdown.Item key={i.label} onSelect={() => { if (i.to === "/admin") s.setRole("admin"); nav({ to: i.to }); }} className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none data-[highlighted]:bg-secondary">
                      <i.icon className="size-4 text-muted-foreground" aria-hidden /> {i.label}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Content>
              </Dropdown.Portal>
            </Dropdown.Root>
            <button className="rounded-lg p-2 md:hidden" onClick={() => setOpen(!open)} aria-label={open ? "Cerrar menú" : "Abrir menú"} aria-expanded={open}>
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="border-t px-4 py-3 md:hidden" aria-label="Principal móvil">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} activeOptions={{ exact: n.to === "/" }} className="block rounded-lg px-3 py-2.5 text-sm font-medium data-[status=active]:bg-primary-soft data-[status=active]:text-petrol">{n.label}</Link>
            ))}
            <Link to="/mi-perfil" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2.5 text-sm font-medium">Mi perfil</Link>
          </nav>
        )}
      </header>
      <main key={path} className="page-enter mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        <Outlet />
      </main>
      <footer className="border-t bg-card">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <span>© Centro Médico Salud Integral · Av. Rivadavia 4520, CABA (dirección ficticia)</span>
          <div className="flex items-center gap-3">
            <DemoBadge />
            <Link to="/admin" onClick={() => s.setRole("admin")} className="font-semibold text-primary hover:underline">Ver backoffice →</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
