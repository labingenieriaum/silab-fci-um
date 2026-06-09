import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlaskConical, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { apiRequest } from "@/lib/api";
import type { Facultad } from "@/types/catalogs";
import type { Laboratory, PaginatedResponse } from "@/types/inventory";

interface LaboratoryFormState {
  facultadId: string;
  nombre: string;
  codigo: string;
  descripcion: string;
}

const initialForm: LaboratoryFormState = {
  facultadId: "",
  nombre: "",
  codigo: "",
  descripcion: ""
};

export function LaboratoriesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<LaboratoryFormState>(initialForm);
  const [feedback, setFeedback] = useState<string | null>(null);

  const laboratoriesQuery = useQuery({
    queryKey: ["laboratories"],
    queryFn: () => apiRequest<PaginatedResponse<Laboratory>>("/laboratories?page=1&pageSize=100")
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

  const facultyOptions = useMemo(
    () =>
      (facultiesQuery.data ?? []).map((faculty) => ({
        value: String(faculty.id),
        label: `${faculty.sigla} - ${faculty.nombre}`,
        searchText: `${faculty.sigla} ${faculty.nombre}`
      })),
    [facultiesQuery.data]
  );

  const createMutation = useMutation({
    mutationFn: (payload: LaboratoryFormState) =>
      apiRequest<Laboratory>("/laboratories", {
        method: "POST",
        body: JSON.stringify({
          facultadId: Number(payload.facultadId),
          nombre: payload.nombre,
          codigo: payload.codigo,
          descripcion: payload.descripcion || undefined
        })
      }),
    onSuccess: async () => {
      setFeedback("Laboratorio creado correctamente.");
      setForm(initialForm);
      await queryClient.invalidateQueries({ queryKey: ["laboratories"] });
    },
    onError: (error) => setFeedback(error instanceof Error ? error.message : "No fue posible crear el laboratorio.")
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest<Laboratory>(`/laboratories/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["laboratories"] });
    }
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    if (!form.facultadId) {
      setFeedback("Selecciona una facultad.");
      return;
    }
    createMutation.mutate(form);
  }

  const laboratories = laboratoriesQuery.data?.data ?? [];

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal">Laboratorios</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Laboratorios asociados a facultades y ubicaciones fisicas.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Laboratorios registrados</CardTitle>
            {laboratoriesQuery.isFetching && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Laboratorio</th>
                    <th className="px-4 py-3 text-left font-semibold">Facultad</th>
                    <th className="px-4 py-3 text-left font-semibold">Responsable</th>
                    <th className="px-4 py-3 text-right font-semibold">Ubicaciones</th>
                    <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {laboratories.map((laboratory) => (
                    <tr key={laboratory.id} className="border-t bg-white">
                      <td className="px-4 py-3">
                        <div className="font-medium">{laboratory.nombre}</div>
                        <div className="text-xs text-muted-foreground">{laboratory.codigo}</div>
                      </td>
                      <td className="px-4 py-3">
                        {laboratory.facultad.sigla} - {laboratory.facultad.nombre}
                      </td>
                      <td className="px-4 py-3">
                        {laboratory.responsable?.nombre ?? "Sin responsable"}
                      </td>
                      <td className="px-4 py-3 text-right">{laboratory._count.ubicaciones}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Eliminar laboratorio"
                          disabled={deleteMutation.isPending || laboratory._count.ubicaciones > 0}
                          onClick={() => deleteMutation.mutate(laboratory.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!laboratories.length && (
                    <tr>
                      <td className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>
                        No hay laboratorios registrados.
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
              <FlaskConical className="h-4 w-4 text-primary" />
              Nuevo laboratorio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Field label="Facultad">
                <SearchableSelect
                  options={facultyOptions}
                  value={form.facultadId}
                  onChange={(value) => setForm((current) => ({ ...current, facultadId: value }))}
                  placeholder="Seleccionar facultad"
                  searchPlaceholder="Buscar por sigla o nombre"
                  emptyLabel="Seleccionar"
                  required
                />
                {(facultiesQuery.data ?? []).length === 1 && (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    Alcance actual: {(facultiesQuery.data ?? [])[0].sigla}
                  </span>
                )}
              </Field>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Nombre">
                  <input
                    className="input-control"
                    value={form.nombre}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, nombre: event.target.value }))
                    }
                    required
                  />
                </Field>
                <Field label="Codigo">
                  <input
                    className="input-control"
                    value={form.codigo}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, codigo: event.target.value }))
                    }
                    required
                  />
                </Field>
              </div>
              <Field label="Descripcion">
                <textarea
                  className="textarea-control"
                  value={form.descripcion}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, descripcion: event.target.value }))
                  }
                />
              </Field>
              {feedback && (
                <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                  {feedback}
                </div>
              )}
              <Button className="w-full" type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Crear laboratorio
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
