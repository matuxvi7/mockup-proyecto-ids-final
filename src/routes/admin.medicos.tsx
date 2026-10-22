import { createFileRoute } from "@tanstack/react-router";
import { ActiveTag, CrudPage } from "@/components/crud";
import { Avatar } from "@/components/kit";
import { useLookup, useStore } from "@/lib/store";
import { pageHead } from "@/lib/format";
import type { Doctor } from "@/lib/types";

export const Route = createFileRoute("/admin/medicos")({
  head: () => pageHead("Médicos", "Gestión de profesionales del Centro Médico Salud Integral (demo)."),
  component: Page,
});

function Page() {
  const s = useStore();
  const L = useLookup();
  return (
    <CrudPage<Doctor>
      title="Médicos"
      subtitle="Profesionales, matrículas, consultorios y coberturas aceptadas."
      noun="Médico"
      collection="doctors"
      items={s.doctors}
      searchText={(d) => `${d.firstName} ${d.lastName} ${d.license} ${L.specialtyName(d.specialtyId)}`}
      blank={() => ({ id: `dr-${Date.now()}`, title: "Dr.", firstName: "", lastName: "", specialtyId: "", license: "", years: 0, email: "", phone: "", roomId: "", insuranceIds: [], bio: "", active: true })}
      deleteBlocker={(d) => (s.appointments.some((a) => a.doctorId === d.id && ["Reservado", "Confirmado"].includes(a.status) && new Date(a.start) > s.now) ? "El profesional tiene turnos futuros activos. Desactivalo en lugar de eliminarlo." : null)}
      columns={[
        { label: "Profesional", render: (d) => <div className="flex items-center gap-3"><Avatar name={`${d.firstName} ${d.lastName}`} size="sm" /><div><p className="font-medium">{d.title} {d.firstName} {d.lastName}</p><p className="text-xs text-muted-foreground">{d.email}</p></div></div> },
        { label: "Especialidad", render: (d) => L.specialtyName(d.specialtyId) },
        { label: "Matrícula", render: (d) => d.license },
        { label: "Consultorio", render: (d) => L.roomName(d.roomId) },
        { label: "Coberturas", render: (d) => d.insuranceIds.length },
        { label: "Estado", render: (d) => <ActiveTag on={d.active} /> },
      ]}
      fields={[
        { key: "title", label: "Título", type: "select", options: [{ value: "Dr.", label: "Dr." }, { value: "Dra.", label: "Dra." }], required: true },
        { key: "license", label: "Matrícula", required: true },
        { key: "firstName", label: "Nombre", required: true },
        { key: "lastName", label: "Apellido", required: true },
        { key: "specialtyId", label: "Especialidad", type: "select", options: s.specialties.map((x) => ({ value: x.id, label: x.name })), required: true },
        { key: "roomId", label: "Consultorio", type: "select", options: s.rooms.map((x) => ({ value: x.id, label: x.code })), required: true },
        { key: "email", label: "Email", type: "email" },
        { key: "phone", label: "Teléfono" },
        { key: "years", label: "Años de experiencia", type: "number" },
        { key: "active", label: "Activo", type: "switch" },
        { key: "insuranceIds", label: "Coberturas aceptadas", type: "multi", options: s.insurances.map((x) => ({ value: x.id, label: x.name })), required: true },
        { key: "bio", label: "Presentación", type: "textarea" },
      ]}
    />
  );
}
