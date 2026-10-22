import { createFileRoute } from "@tanstack/react-router";
import { addDays, differenceInMinutes, format, isSameDay, parseISO, startOfDay, subDays } from "date-fns";
import { Download } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";
import { Button, Card, CardHeader, PageTitle, Segmented } from "@/components/kit";
import { useLookup, useStore } from "@/lib/store";
import { absenteeismRate, averageWait, blockAppliesOn, blockSlots } from "@/lib/rules";
import { pageHead } from "@/lib/format";

export const Route = createFileRoute("/admin/reportes")({
  head: () => pageHead("Reportes", "Ausentismo, ocupación y tiempos de espera (demo)."),
  component: Page,
});

const COLORS = ["var(--primary)", "var(--success)", "var(--success-strong)", "var(--destructive)", "var(--warning)"];

function Page() {
  const s = useStore();
  const L = useLookup();
  const [range, setRange] = useState<"7" | "14" | "28">("28");
  const from = subDays(startOfDay(s.now), Number(range));
  const past = s.appointments.filter((a) => parseISO(a.start) >= from && parseISO(a.start) < s.now);

  const bySpecialty = s.specialties.map((sp) => {
    const l = past.filter((a) => a.specialtyId === sp.id);
    return { name: sp.name, ausentismo: Math.round(absenteeismRate(l) * 100) };
  });
  const statusPie = (["Atendido", "Ausente", "Cancelado"] as const).map((st) => ({ name: st, value: past.filter((a) => a.status === st).length }));
  const occupancy = s.rooms.map((r) => {
    let capacity = 0;
    for (let d = from; d < startOfDay(s.now); d = addDays(d, 1)) {
      for (const doc of s.doctors.filter((x) => x.roomId === r.id))
        for (const b of s.schedules.filter((x) => x.doctorId === doc.id && blockAppliesOn(x, d))) capacity += blockSlots(b, d).length * b.duration;
    }
    const used = past.filter((a) => a.roomId === r.id && a.status !== "Cancelado").reduce((t, a) => t + a.duration, 0);
    return { name: r.code.replace("Consultorio ", "C "), ocupacion: capacity ? Math.min(100, Math.round((used / capacity) * 100)) : 0 };
  });
  const days = Array.from({ length: Number(range) }, (_, i) => addDays(from, i)).filter((d) => d.getDay() !== 0);
  const waitTrend = days.map((d) => ({ dia: format(d, "dd/MM"), espera: averageWait(past.filter((a) => isSameDay(parseISO(a.start), d))) }));
  const waitByDoctor = s.doctors.map((d) => {
    const w = past.filter((a) => a.doctorId === d.id && a.arrivedAt && a.startedAt).map((a) => differenceInMinutes(parseISO(a.startedAt!), parseISO(a.arrivedAt!)));
    return { name: `${d.title} ${d.lastName}`, espera: w.length ? Math.round(w.reduce((x, y) => x + y, 0) / w.length) : 0 };
  });

  return (
    <>
      <PageTitle
        title="Reportes"
        subtitle={`${past.length} turnos analizados · ausentismo general ${Math.round(absenteeismRate(past) * 100)}% · espera promedio ${averageWait(past)} min`}
        action={<>
          <Segmented value={range} onChange={setRange} options={[{ value: "7", label: "7 días" }, { value: "14", label: "14 días" }, { value: "28", label: "28 días" }]} />
          <Button variant="outline" onClick={() => toast.success("Exportación simulada", { description: "Operación demostrativa: no se generó ningún archivo." })}><Download aria-hidden /> Exportar</Button>
        </>}
      />
      <div className="grid gap-6 xl:grid-cols-2">
        <Chart title="Ausentismo por especialidad" subtitle="Ausentes / (atendidos + ausentes)">
          <BarChart data={bySpecialty} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" unit="%" tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
            <Tooltip formatter={(v) => `${v}%`} />
            <Bar dataKey="ausentismo" fill="var(--destructive)" radius={[0, 6, 6, 0]} />
          </BarChart>
        </Chart>
        <Chart title="Resultado de los turnos" subtitle="Período seleccionado">
          <PieChart>
            <Pie data={statusPie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
              {statusPie.map((_, i) => <Cell key={i} fill={[COLORS[1], COLORS[4], COLORS[3]][i] ?? "var(--primary)"} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </Chart>
        <Chart title="Ocupación de consultorios" subtitle="Minutos reservados sobre minutos disponibles">
          <BarChart data={occupancy}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => `${v}%`} />
            <Bar dataKey="ocupacion" fill="var(--primary)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </Chart>
        <Chart title="Tiempo de espera diario" subtitle="Minutos entre llegada e inicio de la atención">
          <LineChart data={waitTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="dia" tick={{ fontSize: 11 }} />
            <YAxis unit=" min" tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v) => `${v} min`} />
            <Line type="monotone" dataKey="espera" stroke="var(--success-strong)" strokeWidth={2.5} dot={false} />
          </LineChart>
        </Chart>
        <div className="xl:col-span-2">
          <Chart title="Espera promedio por profesional" subtitle={L.doctorName("") === "—" ? "Período seleccionado" : ""}>
            <BarChart data={waitByDoctor}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis unit=" min" tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => `${v} min`} />
              <Bar dataKey="espera" fill="var(--warning)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </Chart>
        </div>
      </div>
    </>
  );
}

function Chart({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactElement }) {
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <div className="h-80 p-4"><ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer></div>
    </Card>
  );
}
