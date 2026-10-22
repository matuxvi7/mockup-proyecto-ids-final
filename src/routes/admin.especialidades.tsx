import { createFileRoute } from "@tanstack/react-router";
import { ActiveTag, CrudPage } from "@/components/crud";
import { ICON_KEYS, SpecialtyIcon } from "@/components/brand";
import { useStore } from "@/lib/store";
import { pageHead } from "@/lib/format";
import type { Specialty } from "@/lib/types";

export const Route = createFileRoute("/admin/especialidades")({
  head: () => pageHead("Especialidades", "Gestión de especialidades médicas (demo)."),
  component: Page,
});

function Page() {
  const s = useStore();
  return (
    <CrudPage<Specialty>
      title="Especialidades"
      subtitle="Áreas de atención y duración estándar de los turnos."
      noun="Especialidad"
      collection="specialties"
      items={s.specialties}
      searchText={(x) => x.name}
      blank={() => ({ id: `sp-${Date.now()}`, name: "", icon: "stethoscope", description: "", duration: 20, active: true })}
      deleteBlocker={(x) => (s.doctors.some((d) => d.specialtyId === x.id) ? "Hay profesionales asignados a esta especialidad." : null)}
      validate={(x) => (x.duration < 5 ? "La duración mínima es de 5 minutos." : null)}
      columns={[
        { label: "Especialidad", render: (x) => <div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-lg bg-primary-soft text-primary"><SpecialtyIcon icon={x.icon} className="size-4" /></span><span className="font-medium">{x.name}</span></div> },
        { label: "Profesionales", render: (x) => s.doctors.filter((d) => d.specialtyId === x.id).length },
        { label: "Duración", render: (x) => `${x.duration} min` },
        { label: "Estado", render: (x) => <ActiveTag on={x.active} /> },
      ]}
      fields={[
        { key: "name", label: "Nombre", required: true },
        { key: "icon", label: "Ícono", type: "select", options: ICON_KEYS.map((k) => ({ value: k, label: k })) },
        { key: "duration", label: "Duración del turno (min)", type: "number", required: true },
        { key: "active", label: "Activa", type: "switch" },
        { key: "description", label: "Descripción", type: "textarea" },
      ]}
    />
  );
}
