import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Contact,
  Download,
  FileUp,
  GraduationCap,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { apiRequest } from "@/lib/api";
import { formatEnum } from "@/lib/format";
import type { Facultad, Programa } from "@/types/catalogs";
import type {
  LoanPerson,
  PaginatedPeople,
  PersonPayload,
  RolPersonaPrestamo
} from "@/types/people";

interface PersonFormState {
  codigo: string;
  nombre: string;
  correoInstitucional: string;
  carrera: string;
  semestre: string;
  rol: RolPersonaPrestamo;
  activo: boolean;
}

const initialForm: PersonFormState = {
  codigo: "",
  nombre: "",
  correoInstitucional: "",
  carrera: "",
  semestre: "",
  rol: "ESTUDIANTE",
  activo: true
};

const roleOptions: Array<{ value: RolPersonaPrestamo; label: string }> = [
  { value: "ESTUDIANTE", label: "Estudiante" },
  { value: "PROFESOR", label: "Profesor" },
  { value: "ADMINISTRATIVO", label: "Administrativo" }
];

const activeOptions = [
  { value: "true", label: "Activos" },
  { value: "false", label: "Inactivos" }
];

export function PeoplePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [careerFilter, setCareerFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("true");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<LoanPerson | null>(null);
  const [form, setForm] = useState<PersonFormState>(initialForm);
  const [feedback, setFeedback] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ page: "1", pageSize: "80" });
    if (search.trim()) params.set("search", search.trim());
    if (roleFilter) params.set("rol", roleFilter);
    if (careerFilter.trim()) params.set("carrera", careerFilter.trim());
    if (semesterFilter) params.set("semestre", semesterFilter);
    if (activeFilter) params.set("activo", activeFilter);
    return params.toString();
  }, [activeFilter, careerFilter, roleFilter, search, semesterFilter]);

  const peopleQuery = useQuery({
    queryKey: ["people", queryString],
    queryFn: () => apiRequest<PaginatedPeople>(`/people?${queryString}`)
  });

  const programsQuery = useQuery({
    queryKey: ["programs"],
    queryFn: () => apiRequest<Programa[]>("/programs")
  });

  const facultiesQuery = useQuery({
    queryKey: ["faculties"],
    queryFn: () => apiRequest<Facultad[]>("/faculties")
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, payload }: { id?: number; payload: PersonPayload }) =>
      apiRequest<LoanPerson>(id ? `/people/${id}` : "/people", {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify(payload)
      }),
    onSuccess: async () => {
      setFeedback(editingPerson ? "Persona actualizada." : "Persona registrada.");
      closeModal();
      await queryClient.invalidateQueries({ queryKey: ["people"] });
    },
    onError: setErrorFeedback
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest<LoanPerson>(`/people/${id}`, {
        method: "DELETE"
      }),
    onSuccess: async (person) => {
      setFeedback(
        person.activo
          ? "No fue posible desactivar la persona."
          : "Persona eliminada o desactivada segun su historial."
      );
      await queryClient.invalidateQueries({ queryKey: ["people"] });
    },
    onError: setErrorFeedback
  });

  const bulkMutation = useMutation({
    mutationFn: (personas: PersonPayload[]) =>
      apiRequest<{ created: number; updated: number; total: number; afiliacionesNulas: number }>("/people/bulk", {
        method: "POST",
        body: JSON.stringify({ personas })
      }),
    onSuccess: async (result) => {
      setFeedback(
        `CSV procesado: ${result.created} creadas, ${result.updated} actualizadas, ${result.total} filas.${
          result.afiliacionesNulas
            ? ` ${result.afiliacionesNulas} quedaron sin programa, facultad o dependencia y se guardaron en null.`
            : ""
        }`
      );
      await queryClient.invalidateQueries({ queryKey: ["people"] });
    },
    onError: setErrorFeedback
  });

  const people = peopleQuery.data?.data ?? [];
  const programs = programsQuery.data ?? [];
  const faculties = facultiesQuery.data ?? [];
  const summary = peopleQuery.data?.summary ?? {
    estudiantes: 0,
    profesores: 0,
    administrativos: 0
  };

  function setErrorFeedback(error: unknown) {
    setFeedback(error instanceof Error ? error.message : "No fue posible completar la accion.");
  }

  function updateForm<K extends keyof PersonFormState>(key: K, value: PersonFormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "rol" ? { carrera: "", semestre: value === "ESTUDIANTE" ? current.semestre : "" } : {})
    }));
  }

  function openCreateModal() {
    setEditingPerson(null);
    setForm(initialForm);
    setModalOpen(true);
  }

  function openEditModal(person: LoanPerson) {
    setEditingPerson(person);
    setForm({
      codigo: person.codigo,
      nombre: person.nombre,
      correoInstitucional: person.correoInstitucional ?? "",
      carrera: person.carrera ?? "",
      semestre: person.semestre ? String(person.semestre) : "",
      rol: person.rol,
      activo: person.activo
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingPerson(null);
    setForm(initialForm);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    if (form.rol === "ESTUDIANTE" && form.semestre && Number(form.semestre) < 1) {
      setFeedback("El semestre debe ser mayor a cero.");
      return;
    }
    if (!form.carrera.trim()) {
      setFeedback(
        form.rol === "ADMINISTRATIVO"
          ? "La dependencia es obligatoria."
          : form.rol === "PROFESOR"
            ? "Selecciona la facultad del profesor."
            : "Selecciona el programa del estudiante."
      );
      return;
    }
    saveMutation.mutate({
      id: editingPerson?.id,
      payload: formToPayload(form)
    });
  }

  async function handleCsvUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setFeedback(null);
    try {
      const rows = parsePeopleCsv(await file.text(), programs, faculties);
      if (!rows.length) {
        setFeedback("El CSV no tiene filas validas.");
        return;
      }
      bulkMutation.mutate(rows);
    } catch (error) {
      setErrorFeedback(error);
    }
  }

  function downloadCsvTemplate() {
    const header = [
      "tipoFila",
      "codigo",
      "nombre",
      "correo",
      "rol",
      "programaId",
      "programaNombre",
      "facultadId",
      "facultadNombre",
      "dependencia",
      "semestre"
    ];
    const programRows = programs.map((program) => [
      "REFERENCIA_PROGRAMA",
      "",
      "",
      "",
      "estudiante",
      program.id,
      program.nombre,
      program.facultadId,
      program.facultad?.nombre ?? "",
      "",
      ""
    ]);
    const facultyRows = faculties.map((faculty) => [
      "REFERENCIA_FACULTAD",
      "",
      "",
      "",
      "profesor",
      "",
      "",
      faculty.id,
      faculty.nombre,
      "",
      ""
    ]);
    const exampleProgram = programs[0];
    const exampleFaculty = faculties[0];
    const rows = [
      header,
      ...programRows,
      ...facultyRows,
      [
        "EJEMPLO",
        "123456",
        "Nombre Estudiante",
        "estudiante@umanizales.edu.co",
        "estudiante",
        exampleProgram?.id ?? "",
        exampleProgram?.nombre ?? "",
        "",
        "",
        "",
        "3"
      ],
      [
        "EJEMPLO",
        "DOC001",
        "Nombre Docente",
        "docente@umanizales.edu.co",
        "profesor",
        "",
        "",
        exampleFaculty?.id ?? "",
        exampleFaculty?.nombre ?? "",
        "",
        ""
      ],
      [
        "EJEMPLO",
        "ADM001",
        "Nombre Administrativo",
        "admin@umanizales.edu.co",
        "administrativo",
        "",
        "",
        "",
        "",
        "Laboratorios FCI",
        ""
      ]
    ];
    const content = buildCsvContent(rows);
    const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "formato-personas-prestamo.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const pending = saveMutation.isPending || deleteMutation.isPending || bulkMutation.isPending;
  const programOptions = programs.map((program) => ({
    value: program.nombre,
    label: program.nombre,
    description: `${program.codigo}${program.facultad ? ` - ${program.facultad.sigla}` : ""}`,
    searchText: `${program.codigo} ${program.nombre} ${program.facultad?.nombre ?? ""} ${program.facultad?.sigla ?? ""}`
  }));
  const facultyOptions = faculties.map((faculty) => ({
    value: faculty.nombre,
    label: `${faculty.sigla} - ${faculty.nombre}`,
    description: "Facultad",
    searchText: `${faculty.sigla} ${faculty.nombre}`
  }));

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Personas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Base de estudiantes, profesores y administrativos habilitados para solicitar prestamos.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="button" variant="outline" onClick={downloadCsvTemplate}>
            <Download className="h-4 w-4" />
            Descargar formato
          </Button>
          <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-white px-4 text-sm font-medium hover:bg-accent">
            {bulkMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
            Subir CSV
            <input className="hidden" type="file" accept=".csv,text/csv" onChange={handleCsvUpload} />
          </label>
          <Button type="button" onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Nueva persona
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Metric label="Estudiantes" value={summary.estudiantes} icon={<GraduationCap className="h-4 w-4" />} />
        <Metric label="Profesores" value={summary.profesores} icon={<Users className="h-4 w-4" />} />
        <Metric label="Administrativos" value={summary.administrativos} icon={<Contact className="h-4 w-4" />} />
      </section>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <CardTitle>Directorio de prestamo</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {peopleQuery.data?.total ?? 0} registros encontrados
              </p>
            </div>
            {peopleQuery.isFetching && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </div>
          <div className="grid gap-3 lg:grid-cols-[minmax(220px,1fr)_170px_170px_140px_130px]">
            <div className="flex h-10 items-center gap-2 rounded-md border bg-white px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Codigo, nombre o correo"
              />
            </div>
            <SearchableSelect
              options={roleOptions}
              value={roleFilter}
              onChange={setRoleFilter}
              placeholder="Todos los roles"
              searchPlaceholder="Buscar rol"
              emptyLabel="Todos los roles"
            />
            <input
              className="input-control"
              value={careerFilter}
              onChange={(event) => setCareerFilter(event.target.value)}
              placeholder="Programa, facultad o dependencia"
            />
            <input
              className="input-control"
              type="number"
              min="1"
              value={semesterFilter}
              onChange={(event) => setSemesterFilter(event.target.value)}
              placeholder="Semestre"
            />
            <SearchableSelect
              options={activeOptions}
              value={activeFilter}
              onChange={setActiveFilter}
              placeholder="Todos"
              searchPlaceholder="Buscar estado"
              emptyLabel="Todos"
            />
          </div>
          {feedback && (
            <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              {feedback}
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[940px] text-sm">
              <thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Persona</th>
                  <th className="px-4 py-3 text-left font-semibold">Codigo</th>
                  <th className="px-4 py-3 text-left font-semibold">Rol</th>
                  <th className="px-4 py-3 text-left font-semibold">Vinculacion</th>
                  <th className="px-4 py-3 text-left font-semibold">Semestre</th>
                  <th className="px-4 py-3 text-left font-semibold">Estado</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {people.map((person) => (
                  <tr key={person.id} className="border-t bg-white">
                    <td className="px-4 py-3">
                      <div className="font-medium">{person.nombre}</div>
                      <div className="text-xs text-muted-foreground">
                        {person.correoInstitucional ?? "Sin correo institucional"}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{person.codigo}</td>
                    <td className="px-4 py-3">{formatEnum(person.rol)}</td>
                    <td className="px-4 py-3">{person.carrera ?? "No aplica"}</td>
                    <td className="px-4 py-3">{person.semestre ?? "No aplica"}</td>
                    <td className="px-4 py-3">
                      <span className={person.activo ? "badge badge-green" : "badge badge-gray"}>
                        {person.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => openEditModal(person)}>
                          <Pencil className="h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={pending}
                          onClick={() => deleteMutation.mutate(person.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!people.length && (
                  <tr>
                    <td className="px-4 py-8 text-center text-muted-foreground" colSpan={7}>
                      No hay personas para los filtros actuales.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4 py-6">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
            <form onSubmit={handleSubmit}>
              <div className="border-b px-5 py-4">
                <h2 className="text-lg font-semibold">
                  {editingPerson ? "Actualizar persona" : "Registrar persona"}
                </h2>
              </div>
              <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
                <Field label="Codigo">
                  <input
                    className="input-control"
                    value={form.codigo}
                    onChange={(event) => updateForm("codigo", event.target.value)}
                    required
                  />
                </Field>
                <Field label="Rol">
                  <SearchableSelect
                    options={roleOptions}
                    value={form.rol}
                    onChange={(value) => updateForm("rol", value as RolPersonaPrestamo)}
                    placeholder="Seleccionar rol"
                    searchPlaceholder="Buscar rol"
                    emptyLabel="Seleccionar"
                  />
                </Field>
                <Field label="Nombre completo">
                  <input
                    className="input-control"
                    value={form.nombre}
                    onChange={(event) => updateForm("nombre", event.target.value)}
                    required
                  />
                </Field>
                <Field label="Correo institucional">
                  <input
                    className="input-control"
                    type="email"
                    value={form.correoInstitucional}
                    onChange={(event) => updateForm("correoInstitucional", event.target.value)}
                  />
                </Field>
                <Field label={personAffiliationLabel(form.rol)}>
                  {form.rol === "ADMINISTRATIVO" ? (
                    <input
                      className="input-control"
                      value={form.carrera}
                      onChange={(event) => updateForm("carrera", event.target.value)}
                      placeholder="Ej. Laboratorios FCI, Decanatura, Soporte"
                      required
                    />
                  ) : (
                    <SearchableSelect
                      options={form.rol === "PROFESOR" ? facultyOptions : programOptions}
                      value={form.carrera}
                      onChange={(value) => updateForm("carrera", value)}
                      placeholder={form.rol === "PROFESOR" ? "Seleccionar facultad" : "Seleccionar programa"}
                      searchPlaceholder={form.rol === "PROFESOR" ? "Buscar facultad" : "Buscar programa"}
                      emptyLabel="Seleccionar"
                      required
                    />
                  )}
                </Field>
                <Field label="Semestre">
                  <input
                    className="input-control"
                    type="number"
                    min="1"
                    max="20"
                    disabled={form.rol !== "ESTUDIANTE"}
                    value={form.semestre}
                    onChange={(event) => updateForm("semestre", event.target.value)}
                  />
                </Field>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.activo}
                    onChange={(event) => updateForm("activo", event.target.checked)}
                  />
                  Persona activa
                </label>
              </div>
              <div className="flex justify-end gap-2 border-t px-5 py-4">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Guardar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <span className="text-primary">{icon}</span>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function formToPayload(form: PersonFormState): PersonPayload {
  return {
    codigo: form.codigo,
    nombre: form.nombre,
    correoInstitucional: form.correoInstitucional || null,
    carrera: form.carrera || null,
    semestre: form.rol === "ESTUDIANTE" && form.semestre ? Number(form.semestre) : null,
    rol: form.rol,
    activo: form.activo
  };
}

function personAffiliationLabel(role: RolPersonaPrestamo) {
  if (role === "PROFESOR") return "Facultad";
  if (role === "ADMINISTRATIVO") return "Dependencia";
  return "Programa / carrera";
}

function parsePeopleCsv(content: string, programs: Programa[], faculties: Facultad[]): PersonPayload[] {
  const rows = parseCsvRows(content).filter((row) => row.some((cell) => cell.trim()));
  if (rows.length < 2) {
    return [];
  }
  const headers = rows[0].map(normalizeHeader);
  const people: PersonPayload[] = [];

  rows.slice(1).forEach((row, index) => {
    const record = Object.fromEntries(headers.map((header, column) => [header, row[column]?.trim() ?? ""]));
    const tipoFila = normalizeHeader(record.tipofila);
    if (tipoFila.startsWith("referencia") || tipoFila.startsWith("ejemplo")) {
      return;
    }
    const rol = normalizeRole(record.rol);
    const codigo = record.codigo;
    const nombre = record.nombre;
    if (!codigo || !nombre || !rol) {
      throw new Error(`Fila ${index + 2}: codigo, nombre y rol son obligatorios.`);
    }
    people.push({
      codigo,
      nombre,
      correoInstitucional: record.correo || record.correoinstitucional || null,
      carrera: resolvePersonAffiliation(record, rol, programs, faculties),
      semestre: rol === "ESTUDIANTE" && record.semestre ? Number(record.semestre) : null,
      rol,
      activo: true
    });
  });

  return people;
}

function resolvePersonAffiliation(
  record: Record<string, string>,
  rol: RolPersonaPrestamo,
  programs: Programa[],
  faculties: Facultad[]
) {
  if (rol === "ESTUDIANTE") {
    const programById = record.programaid
      ? programs.find((program) => program.id === Number(record.programaid))
      : undefined;
    return programById?.nombre ?? record.programanombre ?? record.carrera ?? null;
  }
  if (rol === "PROFESOR") {
    const facultyById = record.facultadid
      ? faculties.find((faculty) => faculty.id === Number(record.facultadid))
      : undefined;
    return facultyById?.nombre ?? record.facultadnombre ?? record.carrera ?? null;
  }
  return record.dependencia || record.carrera || null;
}

function buildCsvContent(rows: Array<Array<string | number>>) {
  return rows
    .map((row) =>
      row
        .map((value) => {
          const text = String(value ?? "");
          return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
        })
        .join(";")
    )
    .join("\r\n");
}

function parseCsvRows(content: string) {
  const delimiter = detectCsvDelimiter(content);
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];
    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === delimiter && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
      continue;
    }
    current += char;
  }

  row.push(current);
  rows.push(row);
  return rows;
}

function detectCsvDelimiter(content: string) {
  const firstLine = content.split(/\r?\n/, 1)[0] ?? "";
  const semicolons = (firstLine.match(/;/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  return semicolons > commas ? ";" : ",";
}

function normalizeHeader(value: string) {
  const normalized = value
    .replace(/^\uFEFF/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (normalized === "correoinstitucional" || normalized === "email") return "correo";
  return normalized;
}

function normalizeRole(value: string): RolPersonaPrestamo | null {
  const normalized = normalizeHeader(value);
  if (normalized === "estudiante") return "ESTUDIANTE";
  if (normalized === "profesor" || normalized === "docente") return "PROFESOR";
  if (normalized === "administrativo") return "ADMINISTRATIVO";
  return null;
}
