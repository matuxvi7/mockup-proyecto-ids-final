import { createFileRoute } from "@tanstack/react-router";
import { CrudPage } from "@/components/crud";
import { Avatar } from "@/components/kit";
import { useLookup, useStore } from "@/lib/store";
import { pageHead } from "@/lib/format";
import type { Patient } from "@/lib/types";

export const Route = createFileRoute("/admin/pacientes")({
  head: () => pageHead("Pacientes", "Gestión de pacientes del centro médico (demo)."),
  component: Page,
});

function Page() {
  const s = useStore();
  const L = useLookup();
  return (
    <CrudPage<Patient>
      title="Pacientes"
      subtitle="Datos personales, contacto y cobertura médica."
      noun="Paciente"
      collection="patients"
      items={s.patients}
      searchText={(p) => `${p.firstName} ${p.lastName} ${p.dni} ${p.email}`}
      blank={() => ({ id: `pa-${Date.now()}`, firstName: "", lastName: "", dni: "", birth: "", email: "", phone: "", insuranceId: "", affiliate: "" })}
      validate={(p) => (!/^\d{7,8}$/.test(p.dni) ? "El DNI debe tener 7 u 8 dígitos." : s.patients.some((x) => x.dni === p.dni && x.id !== p.id) ? "Ya existe un paciente con ese DNI." : null)}
      deleteBlocker={(p) => (s.appointments.some((a) => a.patientId === p.id && ["Reservado", "Confirmado"].includes(a.status)) ? "El paciente tiene turnos activos." : null)}
      columns={[
        { label: "Paciente", render: (p) => <div className="flex items-center gap-3"><Avatar name={`${p.firstName} ${p.lastName}`} size="sm" tone="teal" /><div><p className="font-medium">{p.firstName} {p.lastName}</p><p className="text-xs text-muted-foreground">{p.email}</p></div></div> },
        { label: "DNI", render: (p) => p.dni },
        { label: "Teléfono", render: (p) => p.phone },
        { label: "Cobertura", render: (p) => L.insuranceName(p.insuranceId) },
        { label: "Turnos", render: (p) => s.appointments.filter((a) => a.patientId === p.id).length },
      ]}
      fields={[
        { key: "firstName", label: "Nombre", required: true },
        { key: "lastName", label: "Apellido", required: true },
        { key: "dni", label: "DNI", required: true },
        { key: "birth", label: "Fecha de nacimiento", type: "date", required: true },
        { key: "email", label: "Email", type: "email", required: true },
        { key: "phone", label: "Teléfono" },
        { key: "insuranceId", label: "Cobertura", type: "select", options: s.insurances.map((x) => ({ value: x.id, label: x.name })), required: true },
        { key: "affiliate", label: "N° de afiliado" },
      ]}
    />
  );
}
