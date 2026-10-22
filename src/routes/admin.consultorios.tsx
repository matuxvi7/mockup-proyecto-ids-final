import { createFileRoute } from "@tanstack/react-router";
import { ActiveTag, CrudPage } from "@/components/crud";
import { Tag } from "@/components/kit";
import { useLookup, useStore } from "@/lib/store";
import { pageHead } from "@/lib/format";
import type { Room } from "@/lib/types";

export const Route = createFileRoute("/admin/consultorios")({
  head: () => pageHead("Consultorios", "Gestión de consultorios y equipamiento (demo)."),
  component: Page,
});

function Page() {
  const s = useStore();
  const L = useLookup();
  return (
    <CrudPage<Room>
      title="Consultorios"
      subtitle="Espacios físicos, piso, especialidades y equipamiento."
      noun="Consultorio"
      collection="rooms"
      items={s.rooms}
      searchText={(x) => `${x.code} ${x.equipment}`}
      blank={() => ({ id: `rm-${Date.now()}`, code: "", floor: 1, specialtyIds: [], equipment: "", active: true })}
      deleteBlocker={(x) => (s.doctors.some((d) => d.roomId === x.id) ? "Hay profesionales asignados a este consultorio." : null)}
      columns={[
        { label: "Consultorio", render: (x) => <span className="font-medium">{x.code}</span> },
        { label: "Piso", render: (x) => x.floor },
        { label: "Especialidades", render: (x) => <div className="flex flex-wrap gap-1">{x.specialtyIds.map((i) => <Tag key={i}>{L.specialtyName(i)}</Tag>)}</div> },
        { label: "Equipamiento", render: (x) => <span className="text-muted-foreground">{x.equipment}</span> },
        { label: "Estado", render: (x) => <ActiveTag on={x.active} /> },
      ]}
      fields={[
        { key: "code", label: "Nombre / código", required: true },
        { key: "floor", label: "Piso", type: "number" },
        { key: "equipment", label: "Equipamiento", wide: true },
        { key: "active", label: "Habilitado", type: "switch" },
        { key: "specialtyIds", label: "Especialidades", type: "multi", options: s.specialties.map((x) => ({ value: x.id, label: x.name })) },
      ]}
    />
  );
}
