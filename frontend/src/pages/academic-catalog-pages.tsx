import { FormEvent, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  BookOpen,
  ClipboardCheck,
  FlaskConical,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useAuth } from "@/features/auth/auth-context";
import { apiRequest } from "@/lib/api";
import { formatEnum } from "@/lib/format";
import type {
  AcademicUser,
  ActivityRecord,
  PaginatedActivities,
  PaginatedProjects,
  PaginatedSeedbeds,
  PaginatedSubjects,
  Project,
  Seedbed,
  Subject,
  TipoActividad,
  TipoProyecto
} from "@/types/academic";
import type { Facultad, Programa } from "@/types/catalogs";

interface SubjectProfessorForm {
  profesorId: string;
  grupo: string;
  periodo: string;
}

interface SubjectFormState {
  programaId: string;
  codigo: string;
  nombre: string;
  semestre: string;
  profesores: SubjectProfessorForm[];
}

interface SeedbedFormState {
  facultadId: string;
  coordinadorId: string;
  codigo: string;
  nombre: string;
  descripcion: string;
}

interface ProjectFormState {
  programaId: string;
  responsableId: string;
  semilleroId: string;
  nombre: string;
  tipo: TipoProyecto;
  descripcion: string;
}

interface ActivityFormState {
  facultadId: string;
  programaId: string;
  responsableId: string;
  semilleroId: string;
  nombre: string;
  tipo: TipoActividad;
  descripcion: string;
}

const initialSubjectForm: SubjectFormState = {
  programaId: "",
  codigo: "",
  nombre: "",
  semestre: "",
  profesores: []
};

const initialSeedbedForm: SeedbedFormState = {
  facultadId: "",
  coordinadorId: "",
  codigo: "",
  nombre: "",
  descripcion: ""
};

const initialProjectForm: ProjectFormState = {
  programaId: "",
  responsableId: "",
  semilleroId: "",
  nombre: "",
  tipo: "INVESTIGACION",
  descripcion: ""
};

const initialActivityForm: ActivityFormState = {
  facultadId: "",
  programaId: "",
  responsableId: "",
  semilleroId: "",
  nombre: "",
  tipo: "PRACTICA",
  descripcion: ""
};

const projectTypeOptions = [
  "AULA",
  "INVESTIGACION",
  "EXTENSION",
  "SEMILLERO",
  "GRADO",
  "ADMINISTRATIVO",
  "OTRO"
].map((value) => ({ value, label: formatEnum(value), searchText: value }));

const activityTypeOptions = [
  "CLASE",
  "PRACTICA",
  "INVESTIGACION",
  "EXTENSION",
  "CAPACITACION",
  "EVENTO",
  "OTRO"
].map((value) => ({ value, label: formatEnum(value), searchText: value }));

function useAcademicLookups() {
  const facultiesQuery = useQuery({
    queryKey: ["faculties"],
    queryFn: () => apiRequest<Facultad[]>("/faculties")
  });

  const programsQuery = useQuery({
    queryKey: ["programs"],
    queryFn: () => apiRequest<Programa[]>("/programs")
  });

  const usersQuery = useQuery({
    queryKey: ["academic-users"],
    queryFn: () => apiRequest<AcademicUser[]>("/academic-users")
  });

  const seedbedsQuery = useQuery({
    queryKey: ["seedbeds", "lookup"],
    queryFn: () => apiRequest<PaginatedSeedbeds>("/seedbeds?page=1&pageSize=100")
  });

  const faculties = facultiesQuery.data ?? [];
  const programs = programsQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const seedbeds = seedbedsQuery.data?.data ?? [];

  return {
    faculties,
    programs,
    users,
    seedbeds,
    facultyOptions: faculties.map((faculty) => ({
      value: String(faculty.id),
      label: `${faculty.sigla} - ${faculty.nombre}`,
      searchText: `${faculty.sigla} ${faculty.nombre}`
    })),
    programOptions: programs.map((program) => ({
      value: String(program.id),
      label: `${program.codigo} - ${program.nombre}`,
      searchText: `${program.codigo} ${program.nombre}`
    })),
    userOptions: users.map((user) => ({
      value: String(user.id),
      label: user.nombre,
      description: user.correo,
      searchText: `${user.nombre} ${user.correo} ${user.tipoUsuario}`
    })),
    professorOptions: users
      .filter((user) => user.tipoUsuario === "PROFESOR")
      .map((user) => ({
        value: String(user.id),
        label: user.nombre,
        description: user.correo,
        searchText: `${user.nombre} ${user.correo}`
      })),
    seedbedOptions: seedbeds.map((seedbed) => ({
      value: String(seedbed.id),
      label: `${seedbed.codigo} - ${seedbed.nombre}`,
      description: seedbed.coordinador?.nombre,
      searchText: `${seedbed.codigo} ${seedbed.nombre} ${seedbed.coordinador?.nombre ?? ""}`
    }))
  };
}

export function SubjectsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("academia:gestionar");
  const lookups = useAcademicLookups();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<SubjectFormState>(initialSubjectForm);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const subjectsQuery = useQuery({
    queryKey: ["subjects", search],
    queryFn: () =>
      apiRequest<PaginatedSubjects>(
        `/subjects?page=1&pageSize=100${search ? `&search=${encodeURIComponent(search)}` : ""}`
      )
  });

  const saveMutation = useMutation({
    mutationFn: (payload: SubjectFormState) =>
      apiRequest<Subject>(editing ? `/subjects/${editing.id}` : "/subjects", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify({
          programaId: Number(payload.programaId),
          codigo: payload.codigo,
          nombre: payload.nombre,
          semestre: payload.semestre ? Number(payload.semestre) : null,
          profesores: payload.profesores
            .filter((professor) => professor.profesorId)
            .map((professor) => ({
              profesorId: Number(professor.profesorId),
              grupo: professor.grupo || "GENERAL",
              periodo: professor.periodo || undefined
            }))
        })
      }),
    onSuccess: async () => {
      setFeedback(editing ? "Materia actualizada." : "Materia creada.");
      setEditing(null);
      setForm(initialSubjectForm);
      await queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
    onError: (error) => setFeedback(error instanceof Error ? error.message : "No fue posible guardar la materia.")
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest<Subject>(`/subjects/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["subjects"] });
    },
    onError: (error) => setFeedback(error instanceof Error ? error.message : "No fue posible eliminar la materia.")
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    saveMutation.mutate(form);
  }

  function edit(subject: Subject) {
    setEditing(subject);
    setForm({
      programaId: String(subject.programaId),
      codigo: subject.codigo,
      nombre: subject.nombre,
      semestre: subject.semestre ? String(subject.semestre) : "",
      profesores: subject.profesores.map((professor) => ({
        profesorId: String(professor.profesorId),
        grupo: professor.grupo,
        periodo: professor.periodo ?? ""
      }))
    });
  }

  const subjects = subjectsQuery.data?.data ?? [];

  return (
    <CatalogShell
      title="Materias"
      description="Materias por programa con profesores y grupos asociados."
      search={search}
      onSearch={setSearch}
      isFetching={subjectsQuery.isFetching}
    >
      <Card>
        <CardHeader>
          <CardTitle>Materias registradas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[880px] text-sm">
              <thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Materia</th>
                  <th className="px-4 py-3 text-left font-semibold">Programa</th>
                  <th className="px-4 py-3 text-left font-semibold">Profesores / grupos</th>
                  <th className="px-4 py-3 text-right font-semibold">Prestamos</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => (
                  <tr key={subject.id} className="border-t bg-white">
                    <td className="px-4 py-3">
                      <div className="font-medium">{subject.nombre}</div>
                      <div className="text-xs text-muted-foreground">
                        {subject.codigo}
                        {subject.semestre ? ` - semestre ${subject.semestre}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {subject.programa.codigo} - {subject.programa.nombre}
                    </td>
                    <td className="px-4 py-3">
                      {subject.profesores.length
                        ? subject.profesores.map((professor) => (
                            <div key={professor.id}>
                              {professor.profesor.nombre} / {professor.grupo}
                            </div>
                          ))
                        : "Sin profesores"}
                    </td>
                    <td className="px-4 py-3 text-right">{subject._count.prestamos}</td>
                    <td className="px-4 py-3 text-right">
                      <RowActions
                        canManage={canManage}
                        onEdit={() => edit(subject)}
                        onDelete={() => deleteMutation.mutate(subject.id)}
                        deleteDisabled={subject._count.prestamos > 0 || deleteMutation.isPending}
                      />
                    </td>
                  </tr>
                ))}
                {!subjects.length && (
                  <tr>
                    <td className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>
                      No hay materias registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            {editing ? "Editar materia" : "Nueva materia"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={submit}>
            <Field label="Programa">
              <SearchableSelect
                options={lookups.programOptions}
                value={form.programaId}
                onChange={(value) => setForm((current) => ({ ...current, programaId: value }))}
                disabled={!canManage}
                required
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Codigo">
                <input
                  className="input-control"
                  value={form.codigo}
                  onChange={(event) => setForm((current) => ({ ...current, codigo: event.target.value }))}
                  disabled={!canManage}
                  required
                />
              </Field>
              <Field label="Semestre">
                <input
                  className="input-control"
                  type="number"
                  min="1"
                  max="20"
                  value={form.semestre}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, semestre: event.target.value }))
                  }
                  disabled={!canManage}
                />
              </Field>
            </div>
            <Field label="Nombre">
              <input
                className="input-control"
                value={form.nombre}
                onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
                disabled={!canManage}
                required
              />
            </Field>
            <div className="space-y-3 rounded-md border bg-muted/30 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Profesores y grupos</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canManage}
                  onClick={() =>
                    setForm((current) => ({
                      ...current,
                      profesores: [...current.profesores, { profesorId: "", grupo: "GENERAL", periodo: "" }]
                    }))
                  }
                >
                  <Plus className="h-4 w-4" />
                  Agregar
                </Button>
              </div>
              {form.profesores.map((professor, index) => (
                <div key={index} className="grid gap-2 sm:grid-cols-[1fr_110px_110px_40px]">
                  <SearchableSelect
                    options={lookups.professorOptions}
                    value={professor.profesorId}
                    onChange={(value) => updateSubjectProfessor(setForm, index, "profesorId", value)}
                    placeholder="Profesor"
                    disabled={!canManage}
                  />
                  <input
                    className="input-control"
                    value={professor.grupo}
                    onChange={(event) => updateSubjectProfessor(setForm, index, "grupo", event.target.value)}
                    placeholder="Grupo"
                    disabled={!canManage}
                  />
                  <input
                    className="input-control"
                    value={professor.periodo}
                    onChange={(event) => updateSubjectProfessor(setForm, index, "periodo", event.target.value)}
                    placeholder="Periodo"
                    disabled={!canManage}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={!canManage}
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        profesores: current.profesores.filter((_, itemIndex) => itemIndex !== index)
                      }))
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {!form.profesores.length && (
                <p className="text-sm text-muted-foreground">Agrega los profesores o grupos cuando existan.</p>
              )}
            </div>
            <FormActions
              canManage={canManage}
              editing={Boolean(editing)}
              pending={saveMutation.isPending}
              feedback={feedback}
              onCancel={() => {
                setEditing(null);
                setForm(initialSubjectForm);
              }}
              submitLabel={editing ? "Guardar materia" : "Crear materia"}
            />
          </form>
        </CardContent>
      </Card>
    </CatalogShell>
  );
}

export function SeedbedsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("academia:gestionar");
  const lookups = useAcademicLookups();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<SeedbedFormState>(initialSeedbedForm);
  const [editing, setEditing] = useState<Seedbed | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const seedbedsQuery = useQuery({
    queryKey: ["seedbeds", search],
    queryFn: () =>
      apiRequest<PaginatedSeedbeds>(
        `/seedbeds?page=1&pageSize=100${search ? `&search=${encodeURIComponent(search)}` : ""}`
      )
  });

  const saveMutation = useMutation({
    mutationFn: (payload: SeedbedFormState) =>
      apiRequest<Seedbed>(editing ? `/seedbeds/${editing.id}` : "/seedbeds", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify({
          facultadId: Number(payload.facultadId || lookups.faculties[0]?.id),
          coordinadorId: Number(payload.coordinadorId),
          codigo: payload.codigo,
          nombre: payload.nombre,
          descripcion: payload.descripcion || undefined
        })
      }),
    onSuccess: async () => {
      setFeedback(editing ? "Semillero actualizado." : "Semillero creado.");
      setEditing(null);
      setForm(initialSeedbedForm);
      await queryClient.invalidateQueries({ queryKey: ["seedbeds"] });
    },
    onError: (error) => setFeedback(error instanceof Error ? error.message : "No fue posible guardar el semillero.")
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest<Seedbed>(`/seedbeds/${id}`, { method: "DELETE" }),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["seedbeds"] }),
    onError: (error) => setFeedback(error instanceof Error ? error.message : "No fue posible eliminar el semillero.")
  });

  const seedbeds = seedbedsQuery.data?.data ?? [];

  return (
    <CatalogShell
      title="Semilleros"
      description="Semilleros con coordinador y relacion hacia proyectos o actividades."
      search={search}
      onSearch={setSearch}
      isFetching={seedbedsQuery.isFetching}
    >
      <SimpleTable
        title="Semilleros registrados"
        empty="No hay semilleros registrados."
        columns={["Semillero", "Coordinador", "Relacionados", "Acciones"]}
      >
        {seedbeds.map((seedbed) => (
          <tr key={seedbed.id} className="border-t bg-white">
            <td className="px-4 py-3">
              <div className="font-medium">{seedbed.nombre}</div>
              <div className="text-xs text-muted-foreground">{seedbed.codigo}</div>
            </td>
            <td className="px-4 py-3">{seedbed.coordinador.nombre}</td>
            <td className="px-4 py-3">
              {seedbed._count.proyectos} proyectos / {seedbed._count.actividades} actividades
            </td>
            <td className="px-4 py-3 text-right">
              <RowActions
                canManage={canManage}
                onEdit={() => {
                  setEditing(seedbed);
                  setForm({
                    facultadId: String(seedbed.facultadId),
                    coordinadorId: String(seedbed.coordinadorId),
                    codigo: seedbed.codigo,
                    nombre: seedbed.nombre,
                    descripcion: seedbed.descripcion ?? ""
                  });
                }}
                onDelete={() => deleteMutation.mutate(seedbed.id)}
                deleteDisabled={
                  deleteMutation.isPending ||
                  seedbed._count.proyectos + seedbed._count.actividades > 0
                }
              />
            </td>
          </tr>
        ))}
      </SimpleTable>

      <SeedbedForm
        form={form}
        setForm={setForm}
        lookups={lookups}
        canManage={canManage}
        editing={Boolean(editing)}
        pending={saveMutation.isPending}
        feedback={feedback}
        onSubmit={(event) => {
          event.preventDefault();
          saveMutation.mutate(form);
        }}
        onCancel={() => {
          setEditing(null);
          setForm(initialSeedbedForm);
        }}
      />
    </CatalogShell>
  );
}

export function ProjectsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("academia:gestionar");
  const lookups = useAcademicLookups();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<ProjectFormState>(initialProjectForm);
  const [editing, setEditing] = useState<Project | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const projectsQuery = useQuery({
    queryKey: ["projects", search],
    queryFn: () =>
      apiRequest<PaginatedProjects>(
        `/projects?page=1&pageSize=100${search ? `&search=${encodeURIComponent(search)}` : ""}`
      )
  });

  const saveMutation = useMutation({
    mutationFn: (payload: ProjectFormState) =>
      apiRequest<Project>(editing ? `/projects/${editing.id}` : "/projects", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify({
          programaId: Number(payload.programaId),
          responsableId: Number(payload.responsableId),
          semilleroId: payload.semilleroId ? Number(payload.semilleroId) : null,
          nombre: payload.nombre,
          tipo: payload.tipo,
          descripcion: payload.descripcion || undefined
        })
      }),
    onSuccess: async () => {
      setFeedback(editing ? "Proyecto actualizado." : "Proyecto creado.");
      setEditing(null);
      setForm(initialProjectForm);
      await queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error) => setFeedback(error instanceof Error ? error.message : "No fue posible guardar el proyecto.")
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest<Project>(`/projects/${id}`, { method: "DELETE" }),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
    onError: (error) => setFeedback(error instanceof Error ? error.message : "No fue posible eliminar el proyecto.")
  });

  const projects = projectsQuery.data?.data ?? [];

  return (
    <CatalogShell
      title="Proyectos"
      description="Proyectos academicos, investigativos y de extension asociados a semilleros."
      search={search}
      onSearch={setSearch}
      isFetching={projectsQuery.isFetching}
    >
      <SimpleTable
        title="Proyectos registrados"
        empty="No hay proyectos registrados."
        columns={["Proyecto", "Programa", "Semillero", "Responsable", "Acciones"]}
      >
        {projects.map((project) => (
          <tr key={project.id} className="border-t bg-white">
            <td className="px-4 py-3">
              <div className="font-medium">{project.nombre}</div>
              <div className="text-xs text-muted-foreground">{formatEnum(project.tipo)}</div>
            </td>
            <td className="px-4 py-3">{project.programa.nombre}</td>
            <td className="px-4 py-3">{project.semillero?.nombre ?? "Sin semillero"}</td>
            <td className="px-4 py-3">{project.responsable.nombre}</td>
            <td className="px-4 py-3 text-right">
              <RowActions
                canManage={canManage}
                onEdit={() => {
                  setEditing(project);
                  setForm({
                    programaId: String(project.programaId),
                    responsableId: String(project.responsableId),
                    semilleroId: project.semilleroId ? String(project.semilleroId) : "",
                    nombre: project.nombre,
                    tipo: project.tipo,
                    descripcion: project.descripcion ?? ""
                  });
                }}
                onDelete={() => deleteMutation.mutate(project.id)}
                deleteDisabled={deleteMutation.isPending || project._count.prestamos > 0}
              />
            </td>
          </tr>
        ))}
      </SimpleTable>

      <ProjectForm
        form={form}
        setForm={setForm}
        lookups={lookups}
        canManage={canManage}
        editing={Boolean(editing)}
        pending={saveMutation.isPending}
        feedback={feedback}
        onSubmit={(event) => {
          event.preventDefault();
          saveMutation.mutate(form);
        }}
        onCancel={() => {
          setEditing(null);
          setForm(initialProjectForm);
        }}
      />
    </CatalogShell>
  );
}

export function ActivitiesPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const canManage = hasPermission("academia:gestionar");
  const lookups = useAcademicLookups();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<ActivityFormState>(initialActivityForm);
  const [editing, setEditing] = useState<ActivityRecord | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const activitiesQuery = useQuery({
    queryKey: ["activities", search],
    queryFn: () =>
      apiRequest<PaginatedActivities>(
        `/activities?page=1&pageSize=100${search ? `&search=${encodeURIComponent(search)}` : ""}`
      )
  });

  const saveMutation = useMutation({
    mutationFn: (payload: ActivityFormState) =>
      apiRequest<ActivityRecord>(editing ? `/activities/${editing.id}` : "/activities", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify({
          facultadId: Number(payload.facultadId || lookups.faculties[0]?.id),
          programaId: payload.programaId ? Number(payload.programaId) : null,
          responsableId: payload.responsableId ? Number(payload.responsableId) : null,
          semilleroId: payload.semilleroId ? Number(payload.semilleroId) : null,
          nombre: payload.nombre,
          tipo: payload.tipo,
          descripcion: payload.descripcion || undefined
        })
      }),
    onSuccess: async () => {
      setFeedback(editing ? "Actividad actualizada." : "Actividad creada.");
      setEditing(null);
      setForm(initialActivityForm);
      await queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
    onError: (error) => setFeedback(error instanceof Error ? error.message : "No fue posible guardar la actividad.")
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest<ActivityRecord>(`/activities/${id}`, { method: "DELETE" }),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ["activities"] }),
    onError: (error) => setFeedback(error instanceof Error ? error.message : "No fue posible eliminar la actividad.")
  });

  const activities = activitiesQuery.data?.data ?? [];

  return (
    <CatalogShell
      title="Actividades"
      description="Actividades de clase, practica, investigacion o extension asociadas al uso de equipos."
      search={search}
      onSearch={setSearch}
      isFetching={activitiesQuery.isFetching}
    >
      <SimpleTable
        title="Actividades registradas"
        empty="No hay actividades registradas."
        columns={["Actividad", "Programa", "Semillero", "Responsable", "Acciones"]}
      >
        {activities.map((activity) => (
          <tr key={activity.id} className="border-t bg-white">
            <td className="px-4 py-3">
              <div className="font-medium">{activity.nombre}</div>
              <div className="text-xs text-muted-foreground">{formatEnum(activity.tipo)}</div>
            </td>
            <td className="px-4 py-3">{activity.programa?.nombre ?? activity.facultad.sigla}</td>
            <td className="px-4 py-3">{activity.semillero?.nombre ?? "Sin semillero"}</td>
            <td className="px-4 py-3">{activity.responsable?.nombre ?? "Sin responsable"}</td>
            <td className="px-4 py-3 text-right">
              <RowActions
                canManage={canManage}
                onEdit={() => {
                  setEditing(activity);
                  setForm({
                    facultadId: String(activity.facultadId),
                    programaId: activity.programaId ? String(activity.programaId) : "",
                    responsableId: activity.responsableId ? String(activity.responsableId) : "",
                    semilleroId: activity.semilleroId ? String(activity.semilleroId) : "",
                    nombre: activity.nombre,
                    tipo: activity.tipo,
                    descripcion: activity.descripcion ?? ""
                  });
                }}
                onDelete={() => deleteMutation.mutate(activity.id)}
                deleteDisabled={deleteMutation.isPending || activity._count.prestamos > 0}
              />
            </td>
          </tr>
        ))}
      </SimpleTable>

      <ActivityForm
        form={form}
        setForm={setForm}
        lookups={lookups}
        canManage={canManage}
        editing={Boolean(editing)}
        pending={saveMutation.isPending}
        feedback={feedback}
        onSubmit={(event) => {
          event.preventDefault();
          saveMutation.mutate(form);
        }}
        onCancel={() => {
          setEditing(null);
          setForm(initialActivityForm);
        }}
      />
    </CatalogShell>
  );
}

function CatalogShell({
  title,
  description,
  search,
  onSearch,
  isFetching,
  children
}: {
  title: string;
  description: string;
  search: string;
  onSearch: (value: string) => void;
  isFetching: boolean;
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex h-10 items-center gap-2 rounded-md border bg-white px-3">
          {isFetching ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : null}
          <input
            className="h-full w-64 bg-transparent text-sm outline-none"
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Buscar"
          />
        </div>
      </section>
      <section className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_430px]">{children}</section>
    </div>
  );
}

function SimpleTable({
  title,
  empty,
  columns,
  children
}: {
  title: string;
  empty: string;
  columns: string[];
  children: ReactNode;
}) {
  const hasRows = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="px-4 py-3 text-left font-semibold last:text-right">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {children}
              {!hasRows && (
                <tr>
                  <td className="px-4 py-8 text-center text-muted-foreground" colSpan={columns.length}>
                    {empty}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function SeedbedForm(props: {
  form: SeedbedFormState;
  setForm: Dispatch<SetStateAction<SeedbedFormState>>;
  lookups: ReturnType<typeof useAcademicLookups>;
  canManage: boolean;
  editing: boolean;
  pending: boolean;
  feedback: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  const { form, setForm, lookups, canManage, editing, pending, feedback, onSubmit, onCancel } = props;
  return (
    <CatalogForm
      title={editing ? "Editar semillero" : "Nuevo semillero"}
      icon={<FlaskConical className="h-4 w-4 text-primary" />}
      onSubmit={onSubmit}
    >
      <Field label="Facultad">
        <SearchableSelect
          options={lookups.facultyOptions}
          value={form.facultadId || String(lookups.faculties[0]?.id ?? "")}
          onChange={(value) => setForm((current) => ({ ...current, facultadId: value }))}
          disabled={!canManage}
          required
        />
      </Field>
      <Field label="Coordinador">
        <SearchableSelect
          options={lookups.userOptions}
          value={form.coordinadorId}
          onChange={(value) => setForm((current) => ({ ...current, coordinadorId: value }))}
          disabled={!canManage}
          required
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Codigo">
          <input className="input-control" value={form.codigo} onChange={(event) => setForm((current) => ({ ...current, codigo: event.target.value }))} disabled={!canManage} required />
        </Field>
        <Field label="Nombre">
          <input className="input-control" value={form.nombre} onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))} disabled={!canManage} required />
        </Field>
      </div>
      <Field label="Descripcion">
        <textarea className="textarea-control" value={form.descripcion} onChange={(event) => setForm((current) => ({ ...current, descripcion: event.target.value }))} disabled={!canManage} />
      </Field>
      <FormActions canManage={canManage} editing={editing} pending={pending} feedback={feedback} onCancel={onCancel} submitLabel={editing ? "Guardar semillero" : "Crear semillero"} />
    </CatalogForm>
  );
}

function ProjectForm(props: {
  form: ProjectFormState;
  setForm: Dispatch<SetStateAction<ProjectFormState>>;
  lookups: ReturnType<typeof useAcademicLookups>;
  canManage: boolean;
  editing: boolean;
  pending: boolean;
  feedback: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  const { form, setForm, lookups, canManage, editing, pending, feedback, onSubmit, onCancel } = props;
  return (
    <CatalogForm
      title={editing ? "Editar proyecto" : "Nuevo proyecto"}
      icon={<ClipboardCheck className="h-4 w-4 text-primary" />}
      onSubmit={onSubmit}
    >
      <Field label="Programa">
        <SearchableSelect options={lookups.programOptions} value={form.programaId} onChange={(value) => setForm((current) => ({ ...current, programaId: value }))} disabled={!canManage} required />
      </Field>
      <Field label="Responsable">
        <SearchableSelect options={lookups.userOptions} value={form.responsableId} onChange={(value) => setForm((current) => ({ ...current, responsableId: value }))} disabled={!canManage} required />
      </Field>
      <Field label="Semillero">
        <SearchableSelect options={lookups.seedbedOptions} value={form.semilleroId} onChange={(value) => setForm((current) => ({ ...current, semilleroId: value }))} disabled={!canManage} emptyLabel="Sin semillero" />
      </Field>
      <Field label="Nombre">
        <input className="input-control" value={form.nombre} onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))} disabled={!canManage} required />
      </Field>
      <Field label="Tipo">
        <SearchableSelect options={projectTypeOptions} value={form.tipo} onChange={(value) => setForm((current) => ({ ...current, tipo: value as TipoProyecto }))} disabled={!canManage} required />
      </Field>
      <Field label="Descripcion">
        <textarea className="textarea-control" value={form.descripcion} onChange={(event) => setForm((current) => ({ ...current, descripcion: event.target.value }))} disabled={!canManage} />
      </Field>
      <FormActions canManage={canManage} editing={editing} pending={pending} feedback={feedback} onCancel={onCancel} submitLabel={editing ? "Guardar proyecto" : "Crear proyecto"} />
    </CatalogForm>
  );
}

function ActivityForm(props: {
  form: ActivityFormState;
  setForm: Dispatch<SetStateAction<ActivityFormState>>;
  lookups: ReturnType<typeof useAcademicLookups>;
  canManage: boolean;
  editing: boolean;
  pending: boolean;
  feedback: string | null;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  const { form, setForm, lookups, canManage, editing, pending, feedback, onSubmit, onCancel } = props;
  return (
    <CatalogForm
      title={editing ? "Editar actividad" : "Nueva actividad"}
      icon={<Activity className="h-4 w-4 text-primary" />}
      onSubmit={onSubmit}
    >
      <Field label="Facultad">
        <SearchableSelect options={lookups.facultyOptions} value={form.facultadId || String(lookups.faculties[0]?.id ?? "")} onChange={(value) => setForm((current) => ({ ...current, facultadId: value }))} disabled={!canManage} required />
      </Field>
      <Field label="Programa">
        <SearchableSelect options={lookups.programOptions} value={form.programaId} onChange={(value) => setForm((current) => ({ ...current, programaId: value }))} disabled={!canManage} emptyLabel="Sin programa" />
      </Field>
      <Field label="Responsable">
        <SearchableSelect options={lookups.userOptions} value={form.responsableId} onChange={(value) => setForm((current) => ({ ...current, responsableId: value }))} disabled={!canManage} emptyLabel="Sin responsable" />
      </Field>
      <Field label="Semillero">
        <SearchableSelect options={lookups.seedbedOptions} value={form.semilleroId} onChange={(value) => setForm((current) => ({ ...current, semilleroId: value }))} disabled={!canManage} emptyLabel="Sin semillero" />
      </Field>
      <Field label="Nombre">
        <input className="input-control" value={form.nombre} onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))} disabled={!canManage} required />
      </Field>
      <Field label="Tipo">
        <SearchableSelect options={activityTypeOptions} value={form.tipo} onChange={(value) => setForm((current) => ({ ...current, tipo: value as TipoActividad }))} disabled={!canManage} required />
      </Field>
      <Field label="Descripcion">
        <textarea className="textarea-control" value={form.descripcion} onChange={(event) => setForm((current) => ({ ...current, descripcion: event.target.value }))} disabled={!canManage} />
      </Field>
      <FormActions canManage={canManage} editing={editing} pending={pending} feedback={feedback} onCancel={onCancel} submitLabel={editing ? "Guardar actividad" : "Crear actividad"} />
    </CatalogForm>
  );
}

function CatalogForm({
  title,
  icon,
  onSubmit,
  children
}: {
  title: string;
  icon: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={onSubmit}>
          {children}
        </form>
      </CardContent>
    </Card>
  );
}

function RowActions({
  canManage,
  onEdit,
  onDelete,
  deleteDisabled
}: {
  canManage: boolean;
  onEdit: () => void;
  onDelete: () => void;
  deleteDisabled: boolean;
}) {
  return (
    <div className="flex justify-end gap-1">
      <Button variant="ghost" size="icon" aria-label="Editar" disabled={!canManage} onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Eliminar"
        disabled={!canManage || deleteDisabled}
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

function FormActions({
  canManage,
  editing,
  pending,
  feedback,
  onCancel,
  submitLabel
}: {
  canManage: boolean;
  editing: boolean;
  pending: boolean;
  feedback: string | null;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <>
      {!canManage && (
        <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          Necesitas permiso de gestion academica para modificar este catalogo.
        </div>
      )}
      {feedback && (
        <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          {feedback}
        </div>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        {editing && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={pending}>
            <X className="h-4 w-4" />
            Cancelar
          </Button>
        )}
        <Button className={editing ? "" : "sm:col-span-2"} type="submit" disabled={!canManage || pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {submitLabel}
        </Button>
      </div>
    </>
  );
}

function updateSubjectProfessor(
  setForm: Dispatch<SetStateAction<SubjectFormState>>,
  index: number,
  key: keyof SubjectProfessorForm,
  value: string
) {
  setForm((current) => ({
    ...current,
    profesores: current.profesores.map((professor, itemIndex) =>
      itemIndex === index ? { ...professor, [key]: value } : professor
    )
  }));
}
