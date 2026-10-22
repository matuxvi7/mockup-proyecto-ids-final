import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Building2,
  CalendarDays,
  CalendarRange,
  ChevronsLeft,
  ClipboardList,
  HeartHandshake,
  LayoutDashboard,
  Menu,
  QrCode,
  Settings,
  Stethoscope,
  Tags,
  Users,
  Armchair,
  ArrowLeftRight,
} from "lucide-react";
import { isSameDay, parseISO } from "date-fns";
import { useState, type ReactNode } from "react";
import { DemoBadge, Logo, LogoMark } from "@/components/brand";
import { Avatar, Tip } from "@/components/kit";
import { NotificationBell } from "@/components/shared";
import { useStore } from "@/lib/store";
import { fLong } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

const ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/turnos", label: "Turnos", icon: ClipboardList, badge: "today" },
  { to: "/admin/calendario", label: "Calendario", icon: CalendarDays },
  { to: "/admin/sala-espera", label: "Sala de espera", icon: Armchair, badge: "waiting" },
  { to: "/admin/check-in", label: "Check-in QR", icon: QrCode },
  { to: "/admin/medicos", label: "Médicos", icon: Stethoscope },
  { to: "/admin/especialidades", label: "Especialidades", icon: Tags },
  { to: "/admin/consultorios", label: "Consultorios", icon: Building2 },
  { to: "/admin/coberturas", label: "Coberturas", icon: HeartHandshake },
  { to: "/admin/pacientes", label: "Pacientes", icon: Users },
  { to: "/admin/agendas", label: "Agendas médicas", icon: CalendarRange },
  { to: "/admin/reportes", label: "Reportes", icon: BarChart3, adminOnly: true },
  { to: "/admin/configuracion", label: "Configuración", icon: Settings, adminOnly: true },
] as const;

const TITLES: Record<string, string> = Object.fromEntries(ITEMS.map((i) => [i.to, i.label]));

function AdminLayout() {
  const s = useStore();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const path = useRouterState({ select: (r) => r.location.pathname }).replace(/\/$/, "") || "/admin";
  const today = s.appointments.filter((a) => isSameDay(parseISO(a.start), s.now) && a.status !== "Cancelado").length;
  const waiting = s.appointments.filter((a) => a.arrivedAt && a.status === "Confirmado" && isSameDay(parseISO(a.start), s.now)).length;
  const counts = { today, waiting } as Record<string, number>;
  const roleLabel = s.role === "recepcion" ? "Recepción" : "Administración";
  const items = ITEMS.filter((i) => !("adminOnly" in i) || s.role !== "recepcion");

  const nav = (compact: boolean): ReactNode => (
    <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2" aria-label="Backoffice">
      {items.map((i) => {
        const n = "badge" in i ? counts[i.badge] : undefined;
        const link = (
          <Link
            key={i.to}
            to={i.to}
            onClick={() => setDrawer(false)}
            activeOptions={{ exact: true }}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-primary-soft data-[status=active]:text-petrol",
              compact && "justify-center px-0",
            )}
            aria-label={compact ? i.label : undefined}
          >
            <i.icon className="size-[18px] shrink-0" aria-hidden />
            {!compact && <span className="flex-1">{i.label}</span>}
            {!compact && n ? <span className="rounded-md bg-card px-1.5 text-xs font-semibold text-primary">{n}</span> : null}
          </Link>
        );
        return compact ? <Tip key={i.to} content={i.label}>{link}</Tip> : link;
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      <aside className={cn("sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-card transition-[width] duration-200 lg:flex", collapsed ? "w-[72px]" : "w-64")}>
        <div className={cn("flex h-16 items-center border-b px-4", collapsed && "justify-center px-0")}>
          {collapsed ? <Link to="/admin" aria-label="Dashboard"><LogoMark /></Link> : <Logo to="/admin" />}
        </div>
        {nav(collapsed)}
        <div className="space-y-2 border-t p-3">
          <SwitchPortal compact={collapsed} />
          <button onClick={() => setCollapsed(!collapsed)} className="flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-medium text-muted-foreground hover:bg-secondary" aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}>
            <ChevronsLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} aria-hidden /> {!collapsed && "Colapsar"}
          </button>
        </div>
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal aria-label="Menú">
          <div className="absolute inset-0 bg-petrol/30" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-card shadow-pop animate-in slide-in-from-left">
            <div className="flex h-16 items-center border-b px-4"><Logo to="/admin" /></div>
            {nav(false)}
            <div className="border-t p-3"><SwitchPortal compact={false} /></div>
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-card/95 px-4 backdrop-blur sm:px-6">
          <button className="rounded-lg p-2 lg:hidden" onClick={() => setDrawer(true)} aria-label="Abrir menú"><Menu className="size-5" /></button>
          <div className="min-w-0">
            <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
              <Link to="/admin" className="hover:text-foreground">Backoffice</Link>
              {path !== "/admin" && <> / <span className="text-foreground">{TITLES[path] ?? "Sección"}</span></>}
            </nav>
            <p className="truncate text-sm font-semibold capitalize">{fLong(s.now)} · 10:30 <span className="font-normal text-muted-foreground normal-case">(hora simulada)</span></p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <DemoBadge className="hidden xl:inline-flex" />
            <NotificationBell audience="staff" />
            <div className="hidden items-center gap-2 sm:flex">
              <Avatar name={s.role === "recepcion" ? "Paula Recepción" : "Andrés Admin"} size="sm" />
              <div className="leading-tight"><p className="text-sm font-semibold">{s.role === "recepcion" ? "Paula Ramos" : "Andrés Villalba"}</p><p className="text-xs text-muted-foreground">{roleLabel}</p></div>
            </div>
          </div>
        </header>
        <main key={path} className="page-enter flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SwitchPortal({ compact }: { compact: boolean }) {
  const s = useStore();
  const el = (
    <Link to="/" onClick={() => s.setRole("paciente")} className={cn("flex items-center gap-2 rounded-lg border bg-primary-soft px-3 py-2 text-xs font-semibold text-petrol hover:bg-accent", compact && "justify-center px-0")} aria-label="Ir al portal del paciente">
      <ArrowLeftRight className="size-4" aria-hidden /> {!compact && "Portal del paciente"}
    </Link>
  );
  return compact ? <Tip content="Portal del paciente">{el}</Tip> : el;
}
