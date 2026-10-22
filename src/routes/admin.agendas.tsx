import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button, Card, CardHeader, EmptyState, Field, Input, Modal, PageTitle, Select, Tag } from "@/components/kit";
import { useLookup, useStore } from "@/lib/store";
import { blockSlots, validateBlock } from "@/lib/rules";
import { WEEKDAYS, pageHead } from "@/lib/format";
import type { ScheduleBlock } from "@/lib/types";

export const Route = createFileRoute("/admin/agendas")({
  head: () => pageHead("Agendas médicas", "Configuración de bloques horarios por profesional (demo)."),
  component: Page,
});

function Page() {
  const s = useStore();
  const L = useLookup();
  const [doc, setDoc] = useState(s.doctors[0]?.id ?? "");
  const [edit, setEdit] = useState<ScheduleBlock | null>(null);
  const [del, setDel] = useState<ScheduleBlock | null>(null);
  const blocks = s.schedules.filter((b) => b.doctorId === doc);

  const blank = (): ScheduleBlock => ({
    id: `bl-${Date.now()}`, doctorId: doc, weekday: 1, start: "09:00", end: "12:00",
    duration: L.specialty(L.doctor(doc)?.specialtyId ?? "")?.duration ?? s.settings.defaultDuration,
    gap: 0, startDate: format(s.now, "yyyy-MM-dd"), repeat: "semanal",
  });
  const set = <K extends keyof ScheduleBlock>(k: K, v: ScheduleBlock[K]) => setEdit((e) => (e ? { ...e, [k]: v } : e));
  const save = () => {
    if (!edit) return;
    const err = validateBlock(edit, s.schedules);
    if (err) return void toast.error(err);
    s.upsert("schedules", edit);
    toast.success("Bloque de agenda guardado", { description: `${blockSlots(edit, s.now).length} turnos por jornada · Operación demostrativa` });
    setEdit(null);
  };
  const preview = edit ? blockSlots(edit, s.now) : [];

  return (
    <>
      <PageTitle title="Agendas médicas" subtitle="Bloques horarios semanales que generan las franjas reservables." action={<Button onClick={() => setEdit(blank())} disabled={!doc}><Plus aria-hidden /> Nuevo bloque</Button>} />
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card className="h-fit">
          <CardHeader title="Profesionales" />
          <ul className="p-2">
            {s.doctors.map((d) => (
              <li key={d.id}>
                <button onClick={() => setDoc(d.id)} className={`w-full rounded-lg px-3 py-2 text-left text-sm ${doc === d.id ? "bg-primary-soft font-semibold text-petrol" : "hover:bg-secondary"}`}>
                  {L.doctorName(d.id)}
                  <span className="block text-xs font-normal text-muted-foreground">{L.specialtyName(d.specialtyId)} · {s.schedules.filter((b) => b.doctorId === d.id).length} bloques</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title={L.doctorName(doc)} subtitle={`${L.roomName(L.doctor(doc)?.roomId ?? "")} · agenda semanal`} />
          <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((w) => {
              const list = blocks.filter((b) => b.weekday === w).sort((a, b) => a.start.localeCompare(b.start));
              return (
                <div key={w} className="rounded-xl border p-3">
                  <p className="mb-2 text-sm font-semibold">{WEEKDAYS[w]}</p>
                  {list.length ? list.map((b) => (
                    <div key={b.id} className="mb-2 flex items-center gap-2 rounded-lg bg-primary-soft px-3 py-2 text-sm">
                      <button className="flex-1 text-left" onClick={() => setEdit({ ...b })}>
                        <span className="font-semibold text-petrol">{b.start} – {b.end}</span>
                        <span className="block text-xs text-muted-foreground">{b.duration} min · {blockSlots(b, s.now).length} turnos · {b.repeat}</span>
                      </button>
                      <Button variant="ghost" size="icon" aria-label="Eliminar bloque" onClick={() => setDel(b)}><Trash2 className="text-destructive" /></Button>
                    </div>
                  )) : <p className="text-xs text-muted-foreground">No atiende</p>}
                </div>
              );
            })}
          </div>
          {!blocks.length && <EmptyState title="Sin agenda configurada" body="Agregá un bloque para habilitar turnos online." />}
        </Card>
      </div>

      <Modal open={!!edit} onOpenChange={(o) => !o && setEdit(null)} title="Bloque de agenda" description={L.doctorName(doc)} wide footer={<><Button variant="outline" onClick={() => setEdit(null)}>Cancelar</Button><Button onClick={save}>Guardar bloque</Button></>}>
        {edit && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Día"><Select value={edit.weekday} onChange={(e) => set("weekday", Number(e.target.value))}>{WEEKDAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</Select></Field>
              <Field label="Desde"><Input type="time" value={edit.start} onChange={(e) => set("start", e.target.value)} /></Field>
              <Field label="Hasta"><Input type="time" value={edit.end} onChange={(e) => set("end", e.target.value)} /></Field>
              <Field label="Duración (min)"><Input type="number" min={5} value={edit.duration} onChange={(e) => set("duration", Number(e.target.value))} /></Field>
              <Field label="Intervalo entre turnos (min)"><Input type="number" min={0} value={edit.gap} onChange={(e) => set("gap", Number(e.target.value))} /></Field>
              <Field label="Repetición"><Select value={edit.repeat} onChange={(e) => set("repeat", e.target.value as ScheduleBlock["repeat"])}><option value="semanal">Semanal</option><option value="mensual">Mensual (1ª semana)</option></Select></Field>
              <Field label="Vigente desde"><Input type="date" value={edit.startDate} onChange={(e) => set("startDate", e.target.value)} /></Field>
            </div>
            <p className="mt-5 mb-2 text-sm font-medium">Vista previa: {preview.length} turnos</p>
            <div className="flex flex-wrap gap-1.5">{preview.map((t) => <Tag key={t.toISOString()} tone="primary">{format(t, "HH:mm")}</Tag>)}</div>
          </>
        )}
      </Modal>
      <Modal open={!!del} onOpenChange={(o) => !o && setDel(null)} title="Eliminar bloque" description="Los turnos ya reservados se conservan." footer={<><Button variant="outline" onClick={() => setDel(null)}>Cancelar</Button><Button variant="danger" onClick={() => { s.remove("schedules", del!.id); setDel(null); toast.success("Bloque eliminado"); }}>Eliminar</Button></>} />
    </>
  );
}
