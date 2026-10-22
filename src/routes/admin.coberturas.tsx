import { createFileRoute } from "@tanstack/react-router";
import { ActiveTag, CrudPage } from "@/components/crud";
import { Tag } from "@/components/kit";
import { useStore } from "@/lib/store";
import { pageHead } from "@/lib/format";
import type { Insurance } from "@/lib/types";

export const Route = createFileRoute("/admin/coberturas")({
  head: () => pageHead("Coberturas médicas", "Gestión de prepagas y obras sociales (demo)."),
  component: Page,
});

function Page() {
  const s = useStore();
  return (
    <CrudPage<Insurance>
      title="Coberturas médicas"
      subtitle="Prepagas, obras sociales y atención particular."
      noun="Cobertura"
      collection="insurances"
      items={s.insurances}
      searchText={(x) => `${x.name} ${x.type}`}
      blank={() => ({ id: `in-${Date.now()}`, name: "", type: "Prepaga", active: true })}
      deleteBlocker={(x) => (s.patients.some((p) => p.insuranceId === x.id) ? "Hay pacientes asociados a esta cobertura. Desactivala en lugar de eliminarla." : null)}
      columns={[
        { label: "Cobertura", render: (x) => <span className="font-medium">{x.name}</span> },
        { label: "Tipo", render: (x) => <Tag tone="primary">{x.type}</Tag> },
        { label: "Profesionales", render: (x) => s.doctors.filter((d) => d.insuranceIds.includes(x.id)).length },
        { label: "Pacientes", render: (x) => s.patients.filter((p) => p.insuranceId === x.id).length },
        { label: "Estado", render: (x) => <ActiveTag on={x.active} /> },
      ]}
      fields={[
        { key: "name", label: "Nombre", required: true },
        { key: "type", label: "Tipo", type: "select", options: ["Prepaga", "Obra social", "Particular"].map((v) => ({ value: v, label: v })), required: true },
        { key: "active", label: "Activa", type: "switch" },
      ]}
    />
  );
}
