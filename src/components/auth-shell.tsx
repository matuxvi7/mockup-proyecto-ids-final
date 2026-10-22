import type { ReactNode } from "react";
import { DemoBadge, Logo } from "@/components/brand";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <aside className="hidden flex-col justify-between bg-petrol p-10 text-petrol-foreground lg:flex">
        <Logo invert />
        <div>
          <h2 className="text-3xl font-extrabold leading-tight">Tus turnos médicos, organizados en un solo lugar.</h2>
          <p className="mt-3 max-w-md text-sm opacity-80">Reservá, consultá y presentá tu QR de check-in desde el portal del paciente.</p>
        </div>
        <DemoBadge />
      </aside>
      <main className="flex items-center justify-center px-4 py-10">
        <div className="page-enter w-full max-w-md">
          <div className="mb-6 lg:hidden"><Logo /></div>
          <h1 className="text-[28px] font-bold tracking-tight">{title}</h1>
          <p className="mt-1 mb-6 text-[15px] text-muted-foreground">{subtitle}</p>
          {children}
          {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
