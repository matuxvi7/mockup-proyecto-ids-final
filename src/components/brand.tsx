import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  Baby,
  Bone,
  Brain,
  Eye,
  Flower,
  HeartPulse,
  ScanFace,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("size-9", className)} aria-hidden>
      <circle cx="20" cy="20" r="18" className="fill-primary-soft" />
      <circle cx="20" cy="20" r="18" fill="none" className="stroke-primary" strokeWidth="2" />
      <path d="M17 11h6v6h6v6h-6v6h-6v-6h-6v-6h6z" className="fill-teal" />
      <path d="M17 11h6v6h-6z" className="fill-primary" />
    </svg>
  );
}

export function Logo({ to = "/", invert }: { to?: "/" | "/admin"; invert?: boolean }) {
  return (
    <Link to={to} className="flex items-center gap-2.5" aria-label="Salud Integral, inicio">
      <LogoMark />
      <span className="leading-none">
        <span className={cn("block text-[15px] font-bold", invert ? "text-petrol-foreground" : "text-petrol")}>Salud Integral</span>
        <span className="block text-[11px] font-medium tracking-wider text-muted-foreground uppercase">Centro Médico</span>
      </span>
    </Link>
  );
}

export function DemoBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border bg-warning-soft px-2.5 py-1 text-[11px] font-semibold text-warning-foreground", className)}>
      <span className="size-1.5 rounded-full bg-warning" aria-hidden />
      DEMO · Datos ficticios · Entorno de presentación
    </span>
  );
}

const ICONS: Record<string, LucideIcon> = {
  stethoscope: Stethoscope,
  "heart-pulse": HeartPulse,
  baby: Baby,
  "scan-face": ScanFace,
  bone: Bone,
  flower: Flower,
  eye: Eye,
  brain: Brain,
};
export const ICON_KEYS = Object.keys(ICONS);
export function SpecialtyIcon({ icon, className }: { icon: string; className?: string }) {
  const I = ICONS[icon] ?? Stethoscope;
  return <I className={cn("size-5", className)} aria-hidden />;
}
