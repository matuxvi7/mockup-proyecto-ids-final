import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export const fDate = (iso: string | Date, pattern = "EEE d 'de' MMM") =>
  format(typeof iso === "string" ? parseISO(iso) : iso, pattern, { locale: es });
export const fTime = (iso: string | Date) => format(typeof iso === "string" ? parseISO(iso) : iso, "HH:mm");
export const fLong = (iso: string | Date) => fDate(iso, "EEEE d 'de' MMMM");
export const WEEKDAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

export function pageHead(title: string, description: string) {
  const t = `${title} · Salud Integral`;
  return {
    meta: [
      { title: t },
      { name: "description", content: description },
      { property: "og:title", content: t },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  };
}
