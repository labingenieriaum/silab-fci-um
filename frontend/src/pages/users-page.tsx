import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  Loader2,
  Search,
  ShieldCheck,
  UserPlus,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/api";
import type { TipoUsuario } from "@/types/auth";
import type { Facultad, Programa, Role } from "@/types/catalogs";
import type { CreateUserPayload, PaginatedUsers, UserListItem } from "@/types/users";

const tipoUsuarioOptions: Array<{ value: TipoUsuario; label: string }> = [
  { value: "ADMINISTRADOR", label: "Administrador" },
  { value: "COORDINACION_LABORATORIOS", label: "Coordinacion de laboratorios" },
  { value: "DECANO", label: "Decano" },
  { value: "DIRECTOR_PROGRAMA", label: "Director de programa" },
  { value: "PROFESOR", label: "Profesor" },
  { value: "ESTUDIANTE", label: "Estudiante" },
  { value: "MONITOR", label: "Monitor" }
];

interface UserFormState {
  nombre: string;
  correo: string;
  documento: string;
  password: string;
  tipoUsuario: TipoUsuario;
  rolId: string;
  facultadId: string;
  programaId: string;
}

const initialFormState: UserFormState = {
  nombre: "",
  correo: "",
  documento: "",
  password: "",
  tipoUsuario: "PROFESOR",
  rolId: "",
  facultadId: "",
  programaId: ""
};

export function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<UserFormState>(initialFormState);
  const [feedback, setFeedback] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: ["users", search],
    queryFn: () =>
      apiRequest<PaginatedUsers>(
        `/users?page=1&pageSize=20${search ? `&search=${encodeURIComponent(search)}` : ""}`
      )
  });

  const rolesQuery = useQuery({
    queryKey: ["roles"],
    queryFn: () => apiRequest<Role[]>("/roles")
  });

  const facultiesQuery = useQuery({
    queryKey: ["faculties"],
    queryFn: () => apiRequest<Facultad[]>("/faculties")
  });

  useEffect(() => {
    const faculties = facultiesQuery.data ?? [];
    if (!form.facultadId && faculties.length === 1) {
      setForm((current) => ({
        ...current,
        facultadId: String(faculties[0].id)
      }));
    }
  }, [facultiesQuery.data, form.facultadId]);

  const programsQuery = useQuery({
    queryKey: ["programs"],
    queryFn: () => apiRequest<Programa[]>("/programs")
  });

  const filteredPrograms = useMemo(() => {
    const programs = programsQuery.data ?? [];
    if (!form.facultadId) {
      return programs;
    }
    return programs.filter((program) => program.facultadId === Number(form.facultadId));
  }, [form.facultadId, programsQuery.data]);

  const createUserMutation = useMutation({
    mutationFn: (payload: CreateUserPayload) =>
      apiRequest<UserListItem>("/users", {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    onSuccess: async () => {
      setFeedback("Usuario creado correctamente.");
      setForm(initialFormState);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error) => {
      setFeedback(error instanceof Error ? error.message : "No fue posible crear el usuario.");
    }
  });

  const setActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      apiRequest<UserListItem>(`/users/${id}/${active ? "activate" : "deactivate"}`, {
        method: "PATCH"
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    }
  });

  function updateForm<K extends keyof UserFormState>(key: K, value: UserFormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "facultadId" ? { programaId: "" } : {})
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (!form.rolId) {
      setFeedback("Selecciona un rol.");
      return;
    }

    createUserMutation.mutate({
      nombre: form.nombre,
      correo: form.correo,
      documento: form.documento,
      password: form.password,
      tipoUsuario: form.tipoUsuario,
      rolId: Number(form.rolId),
      facultadId: form.facultadId ? Number(form.facultadId) : undefined,
      programaId: form.programaId ? Number(form.programaId) : undefined,
      activo: true
    });
  }

  const users = usersQuery.data?.data ?? [];
  const total = usersQuery.data?.total ?? 0;

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Usuarios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestion de usuarios, roles y alcance academico desde la base de datos real.
          </p>
        </div>
        <div className="flex h-10 items-center gap-2 rounded-md border bg-white px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            className="h-full w-64 bg-transparent text-sm outline-none"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, correo o documento"
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Usuarios registrados</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{total} registros encontrados</p>
            </div>
            {usersQuery.isFetching && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[780px] text-sm">
                <thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Usuario</th>
                    <th className="px-4 py-3 text-left font-semibold">Rol</th>
                    <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                    <th className="px-4 py-3 text-left font-semibold">Programa</th>
                    <th className="px-4 py-3 text-left font-semibold">Estado</th>
                    <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-t bg-white">
                      <td className="px-4 py-3">
                        <div className="font-medium">{user.nombre}</div>
                        <div className="text-xs text-muted-foreground">{user.correo}</div>
                        <div className="text-xs text-muted-foreground">Doc. {user.documento}</div>
                      </td>
                      <td className="px-4 py-3">{user.rol.nombre}</td>
                      <td className="px-4 py-3">{formatTipoUsuario(user.tipoUsuario)}</td>
                      <td className="px-4 py-3">
                        {user.programa ? `${user.programa.codigo} - ${user.programa.nombre}` : "Sin programa"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={user.activo ? "badge badge-green" : "badge badge-gray"}>
                          {user.activo ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          {user.activo ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={setActiveMutation.isPending}
                          onClick={() =>
                            setActiveMutation.mutate({
                              id: user.id,
                              active: !user.activo
                            })
                          }
                        >
                          {user.activo ? "Desactivar" : "Activar"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!users.length && (
                    <tr>
                      <td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>
                        No hay usuarios para los filtros actuales.
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
              <UserPlus className="h-4 w-4 text-primary" />
              Crear usuario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Field label="Nombre completo">
                <input
                  className="input-control"
                  value={form.nombre}
                  onChange={(event) => updateForm("nombre", event.target.value)}
                  required
                />
              </Field>

              <Field label="Correo">
                <input
                  className="input-control"
                  type="email"
                  value={form.correo}
                  onChange={(event) => updateForm("correo", event.target.value)}
                  required
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Documento">
                  <input
                    className="input-control"
                    value={form.documento}
                    onChange={(event) => updateForm("documento", event.target.value)}
                    required
                  />
                </Field>
                <Field label="Contrasena inicial">
                  <input
                    className="input-control"
                    type="password"
                    value={form.password}
                    onChange={(event) => updateForm("password", event.target.value)}
                    required
                    minLength={8}
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Tipo de usuario">
                  <select
                    className="input-control"
                    value={form.tipoUsuario}
                    onChange={(event) =>
                      updateForm("tipoUsuario", event.target.value as TipoUsuario)
                    }
                  >
                    {tipoUsuarioOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Rol">
                  <select
                    className="input-control"
                    value={form.rolId}
                    onChange={(event) => updateForm("rolId", event.target.value)}
                    required
                  >
                    <option value="">Seleccionar</option>
                    {(rolesQuery.data ?? []).map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.nombre}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Facultad">
                  <select
                    className="input-control"
                    value={form.facultadId}
                    onChange={(event) => updateForm("facultadId", event.target.value)}
                  >
                    <option value="">Sin facultad</option>
                    {(facultiesQuery.data ?? []).map((faculty) => (
                      <option key={faculty.id} value={faculty.id}>
                        {faculty.sigla} - {faculty.nombre}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Programa">
                  <select
                    className="input-control"
                    value={form.programaId}
                    onChange={(event) => updateForm("programaId", event.target.value)}
                  >
                    <option value="">Sin programa</option>
                    {filteredPrograms.map((program) => (
                      <option key={program.id} value={program.id}>
                        {program.codigo} - {program.nombre}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {feedback && (
                <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                  {feedback}
                </div>
              )}

              <Button className="w-full" type="submit" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Crear usuario
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

function formatTipoUsuario(tipo: TipoUsuario) {
  return tipo
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}
