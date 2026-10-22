import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button, Card, Checkbox, EmptyState, Field, Input, Modal, PageTitle, Select, Switch, Table, Tag, Textarea, td } from "./kit";
import { useStore } from "@/lib/store";

export type FieldDef<T> = {
  key: keyof T & string;
  label: string;
  type?: "text" | "number" | "email" | "date" | "select" | "multi" | "textarea" | "switch";
  options?: { value: string; label: string }[];
  required?: boolean;
  wide?: boolean;
};
export type Col<T> = { label: string; render: (x: T) => ReactNode };

type Collection = "specialties" | "doctors" | "rooms" | "insurances" | "patients" | "schedules";

export function CrudPage<T extends { id: string }>(props: {
  title: string;
  subtitle: string;
  noun: string;
  collection: Collection;
  items: T[];
  columns: Col<T>[];
  fields: FieldDef<T>[];
  blank: () => T;
  searchText: (x: T) => string;
  deleteBlocker?: (x: T) => string | null;
  validate?: (x: T) => string | null;
  extraFilter?: ReactNode;
}) {
  const s = useStore();
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<T | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [del, setDel] = useState<T | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const list = props.items.filter((x) => props.searchText(x).toLowerCase().includes(q.toLowerCase()));

  const open = (x: T | null) => {
    setErrors({});
    setIsNew(!x);
    setEdit(x ? structuredClone(x) : props.blank());
  };
  const set = (k: string, v: unknown) => setEdit((e) => (e ? ({ ...e, [k]: v } as T) : e));

  const save = () => {
    if (!edit) return;
    const errs: Record<string, string> = {};
    for (const f of props.fields) {
      const v = (edit as Record<string, unknown>)[f.key];
      if (f.required && (v === "" || v === undefined || (Array.isArray(v) && !v.length))) errs[f.key] = "Campo obligatorio";
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const err = props.validate?.(edit);
    if (err) return void toast.error(err);
    s.upsert(props.collection, edit as never);
    toast.success(isNew ? `${props.noun} creado` : `${props.noun} actualizado`, { description: "Operación demostrativa" });
    setEdit(null);
  };

  const confirmDelete = () => {
    if (!del) return;
    s.remove(props.collection, del.id);
    toast.success(`${props.noun} eliminado`, { description: "Operación demostrativa" });
    setDel(null);
  };

  return (
    <>
      <PageTitle title={props.title} subtitle={props.subtitle} action={<Button onClick={() => open(null)}><Plus aria-hidden /> Nuevo</Button>} />
      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b p-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute top-3.5 left-3 size-4 text-muted-foreground" aria-hidden />
            <Input aria-label="Buscar" placeholder="Buscar…" className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {props.extraFilter}
          <span className="ml-auto text-sm text-muted-foreground">{list.length} registros</span>
        </div>
        {list.length === 0 ? (
          <EmptyState title="Sin resultados" body="No hay registros que coincidan con la búsqueda." />
        ) : (
          <Table head={[...props.columns.map((c) => c.label), ""]}>
            {list.map((x) => (
              <tr key={x.id} className="hover:bg-muted/40">
                {props.columns.map((c) => (
                  <td key={c.label} className={td}>{c.render(x)}</td>
                ))}
                <td className={`${td} text-right`}>
                  <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => open(x)}><Pencil /></Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Eliminar"
                    onClick={() => {
                      const b = props.deleteBlocker?.(x);
                      if (b) toast.error(b);
                      else setDel(x);
                    }}
                  >
                    <Trash2 className="text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Modal
        open={!!edit}
        onOpenChange={(o) => !o && setEdit(null)}
        title={isNew ? `Nuevo ${props.noun.toLowerCase()}` : `Editar ${props.noun.toLowerCase()}`}
        wide
        footer={<><Button variant="outline" onClick={() => setEdit(null)}>Cancelar</Button><Button onClick={save}>Guardar</Button></>}
      >
        {edit && (
          <div className="grid gap-4 sm:grid-cols-2">
            {props.fields.map((f) => {
              const v = (edit as Record<string, unknown>)[f.key];
              const err = errors[f.key];
              const cls = f.wide || f.type === "multi" || f.type === "textarea" ? "sm:col-span-2" : "";
              if (f.type === "switch")
                return (
                  <div key={f.key} className={`flex items-center justify-between rounded-lg border p-3 ${cls}`}>
                    <span className="text-sm font-medium">{f.label}</span>
                    <Switch label={f.label} checked={!!v} onChange={(b) => set(f.key, b)} />
                  </div>
                );
              if (f.type === "multi") {
                const arr = (v as string[]) ?? [];
                return (
                  <fieldset key={f.key} className={cls}>
                    <legend className="mb-2 text-[13px] font-medium">{f.label}</legend>
                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                      {f.options!.map((o) => (
                        <Checkbox key={o.value} label={o.label} checked={arr.includes(o.value)} onChange={(c) => set(f.key, c ? [...arr, o.value] : arr.filter((z) => z !== o.value))} />
                      ))}
                    </div>
                    {err && <p role="alert" className="mt-1 text-xs font-medium text-destructive">{err}</p>}
                  </fieldset>
                );
              }
              return (
                <Field key={f.key} label={f.label + (f.required ? " *" : "")} error={err} className={cls}>
                  {f.type === "select" ? (
                    <Select value={String(v ?? "")} onChange={(e) => set(f.key, e.target.value)} aria-invalid={!!err}>
                      <option value="">Seleccionar…</option>
                      {f.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </Select>
                  ) : f.type === "textarea" ? (
                    <Textarea value={String(v ?? "")} onChange={(e) => set(f.key, e.target.value)} />
                  ) : (
                    <Input
                      type={f.type ?? "text"}
                      value={String(v ?? "")}
                      aria-invalid={!!err}
                      onChange={(e) => set(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)}
                    />
                  )}
                </Field>
              );
            })}
          </div>
        )}
      </Modal>

      <Modal
        open={!!del}
        onOpenChange={(o) => !o && setDel(null)}
        title={`Eliminar ${props.noun.toLowerCase()}`}
        description="Esta acción solo afecta los datos de demostración."
        footer={<><Button variant="outline" onClick={() => setDel(null)}>Cancelar</Button><Button variant="danger" onClick={confirmDelete}>Eliminar</Button></>}
      />
    </>
  );
}

export const ActiveTag = ({ on }: { on: boolean }) => <Tag tone={on ? "success" : "muted"}>{on ? "Activo" : "Inactivo"}</Tag>;
