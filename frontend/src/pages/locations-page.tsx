import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { LocationCombobox } from "@/components/location-combobox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { apiRequest } from "@/lib/api";
import { formatEnum } from "@/lib/format";
import type { Laboratory, Location, PaginatedResponse, TipoUbicacion } from "@/types/inventory";

const locationTypes: TipoUbicacion[] = [
  "EDIFICIO",
  "PISO",
  "LABORATORIO",
  "SALA",
  "ALMACEN",
  "ESTANTE",
  "GABINETE",
  "NIVEL",
  "CAJON",
  "CAJA",
  "OTRO"
];

interface LocationFormState {
  laboratorioId: string;
  ubicacionPadreId: string;
  nombre: string;
  tipo: TipoUbicacion;
  descripcion: string;
  activa: boolean;
}

const initialForm: LocationFormState = {
  laboratorioId: "",
  ubicacionPadreId: "",
  nombre: "",
  tipo: "LABORATORIO",
  descripcion: "",
  activa: true
};

export function LocationsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<LocationFormState>(initialForm);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [laboratoryFilter, setLaboratoryFilter] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [parentFilter, setParentFilter] = useState("");
  const [editingLocationId, setEditingLocationId] = useState<number | null>(null);

  const laboratoriesQuery = useQuery({
    queryKey: ["laboratories"],
    queryFn: () => apiRequest<PaginatedResponse<Laboratory>>("/laboratories?page=1&pageSize=100")
  });

  const locationsQuery = useQuery({
    queryKey: ["locations", laboratoryFilter],
    queryFn: () =>
      apiRequest<PaginatedResponse<Location>>(
        `/locations?page=1&pageSize=100${laboratoryFilter ? `&laboratorioId=${laboratoryFilter}` : ""}`
      )
  });

  const createMutation = useMutation({
    mutationFn: (payload: LocationFormState) =>
      apiRequest<Location>("/locations", {
        method: "POST",
        body: JSON.stringify(toLocationPayload(payload))
      }),
    onSuccess: async () => {
      setFeedback("Ubicacion creada correctamente.");
      resetForm();
      await queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
    onError: (error) => setFeedback(error instanceof Error ? error.message : "No fue posible crear la ubicacion.")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: LocationFormState }) =>
      apiRequest<Location>(`/locations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(toLocationPayload(payload))
      }),
    onSuccess: async () => {
      setFeedback("Ubicacion actualizada correctamente.");
      resetForm();
      await queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
    onError: (error) =>
      setFeedback(error instanceof Error ? error.message : "No fue posible actualizar la ubicacion.")
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest<Location>(`/locations/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["locations"] });
    }
  });

  const locations = useMemo(() => locationsQuery.data?.data ?? [], [locationsQuery.data]);
  const laboratories = laboratoriesQuery.data?.data ?? [];

  const excludedParentIds = useMemo(
    () => (editingLocationId ? collectDescendantIds(locations, editingLocationId) : new Set<number>()),
    [editingLocationId, locations]
  );

  const parentOptions = useMemo(
    () =>
      locations
        .filter((location) => !form.laboratorioId || location.laboratorioId === Number(form.laboratorioId))
        .filter((location) => location.id !== editingLocationId)
        .filter((location) => !excludedParentIds.has(location.id)),
    [editingLocationId, excludedParentIds, form.laboratorioId, locations]
  );

  const parentFilterOptions = useMemo(
    () =>
      locations.filter((location) =>
        !laboratoryFilter || location.laboratorioId === Number(laboratoryFilter)
      ),
    [laboratoryFilter, locations]
  );

  const visibleLocations = useMemo(
    () =>
      locations
        .filter((location) => matchesLocationSearch(location, locationSearch))
        .filter((location) => {
          if (!parentFilter) return true;
          if (parentFilter === "none") return !location.ubicacionPadreId;
          return location.ubicacionPadreId === Number(parentFilter);
        }),
    [locationSearch, locations, parentFilter]
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    if (!form.laboratorioId) {
      setFeedback("Selecciona un laboratorio.");
      return;
    }
    if (editingLocationId) {
      updateMutation.mutate({ id: editingLocationId, payload: form });
      return;
    }
    createMutation.mutate(form);
  }

  function startEdit(location: Location) {
    setFeedback(null);
    setEditingLocationId(location.id);
    setForm({
      laboratorioId: String(location.laboratorioId),
      ubicacionPadreId: location.ubicacionPadreId ? String(location.ubicacionPadreId) : "",
      nombre: location.nombre,
      tipo: location.tipo,
      descripcion: location.descripcion ?? "",
      activa: location.activa
    });
  }

  function resetForm() {
    setForm(initialForm);
    setEditingLocationId(null);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Ubicaciones</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Estructura fisica jerarquica donde se asignan equipos y unidades.
          </p>
        </div>
        <select
          className="input-control max-w-xs"
          value={laboratoryFilter}
          onChange={(event) => {
            setLaboratoryFilter(event.target.value);
            setParentFilter("");
          }}
        >
          <option value="">Todos los laboratorios</option>
          {laboratories.map((laboratory) => (
            <option key={laboratory.id} value={laboratory.id}>
              {laboratory.nombre}
            </option>
          ))}
        </select>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_430px]">
        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <CardTitle>Ubicaciones registradas</CardTitle>
              {locationsQuery.isFetching && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            </div>
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
              <div className="flex h-10 items-center gap-2 rounded-md border bg-white px-3">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  className="h-full w-full bg-transparent text-sm outline-none"
                  value={locationSearch}
                  onChange={(event) => setLocationSearch(event.target.value)}
                  placeholder="Buscar ubicacion por nombre"
                />
              </div>
              <select
                className="input-control"
                value={parentFilter}
                onChange={(event) => setParentFilter(event.target.value)}
              >
                <option value="">Todos los padres</option>
                <option value="none">Sin padre</option>
                {parentFilterOptions.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.nombre}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[1120px] text-sm">
                <thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Ubicacion</th>
                    <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                    <th className="px-4 py-3 text-left font-semibold">Laboratorio</th>
                    <th className="px-4 py-3 text-left font-semibold">Padre</th>
                    <th className="px-4 py-3 text-left font-semibold">Descripcion</th>
                    <th className="px-4 py-3 text-right font-semibold">Equipos</th>
                    <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleLocations.map((location) => (
                    <tr key={location.id} className="border-t bg-white">
                      <td className="px-4 py-3">
                        <div className="font-medium">{location.nombre}</div>
                        <div className="text-xs text-muted-foreground">
                          {location.activa ? "Activa" : "Inactiva"}
                        </div>
                      </td>
                      <td className="px-4 py-3">{formatEnum(location.tipo)}</td>
                      <td className="px-4 py-3">{location.laboratorio.nombre}</td>
                      <td className="px-4 py-3">
                        {location.ubicacionPadre ? (
                          <div>
                            <div>{location.ubicacionPadre.nombre}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatEnum(location.ubicacionPadre.tipo)}
                            </div>
                          </div>
                        ) : (
                          "Sin padre"
                        )}
                      </td>
                      <td className="max-w-[280px] px-4 py-3 text-sm text-muted-foreground">
                        {location.descripcion || "Sin descripcion"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {location._count.equipos + location._count.unidades}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Editar ubicacion"
                            onClick={() => startEdit(location)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Eliminar ubicacion"
                            disabled={
                              deleteMutation.isPending ||
                              location._count.sububicaciones + location._count.equipos + location._count.unidades > 0
                            }
                            onClick={() => deleteMutation.mutate(location.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!visibleLocations.length && (
                    <tr>
                      <td className="px-4 py-8 text-center text-muted-foreground" colSpan={7}>
                        No hay ubicaciones registradas para los filtros actuales.
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
              <MapPin className="h-4 w-4 text-primary" />
              {editingLocationId ? "Editar ubicacion" : "Nueva ubicacion"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Field label="Laboratorio">
                <select
                  className="input-control"
                  value={form.laboratorioId}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      laboratorioId: event.target.value,
                      ubicacionPadreId: ""
                    }))
                  }
                  required
                >
                  <option value="">Seleccionar</option>
                  {laboratories.map((laboratory) => (
                    <option key={laboratory.id} value={laboratory.id}>
                      {laboratory.nombre}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Ubicacion padre">
                <LocationCombobox
                  locations={parentOptions}
                  value={form.ubicacionPadreId}
                  onChange={(value) =>
                    setForm((current) => ({ ...current, ubicacionPadreId: value }))
                  }
                  emptyLabel="Sin padre"
                  placeholder="Sin padre"
                  searchPlaceholder="Buscar padre por nombre"
                />
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
                <Field label="Tipo">
                  <select
                    className="input-control"
                    value={form.tipo}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        tipo: event.target.value as TipoUbicacion
                      }))
                    }
                  >
                    {locationTypes.map((type) => (
                      <option key={type} value={type}>
                        {formatEnum(type)}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {editingLocationId && (
                <label className="flex h-10 items-center gap-2 rounded-md border bg-white px-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.activa}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, activa: event.target.checked }))
                    }
                  />
                  Activa
                </label>
              )}

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
              <div className="grid gap-2 sm:grid-cols-2">
                <Button className="w-full" type="submit" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {editingLocationId ? "Guardar cambios" : "Crear ubicacion"}
                </Button>
                {editingLocationId && (
                  <Button type="button" variant="outline" onClick={resetForm} disabled={isSaving}>
                    <X className="h-4 w-4" />
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function toLocationPayload(payload: LocationFormState) {
  return {
    laboratorioId: Number(payload.laboratorioId),
    ubicacionPadreId: payload.ubicacionPadreId ? Number(payload.ubicacionPadreId) : null,
    nombre: payload.nombre,
    tipo: payload.tipo,
    descripcion: payload.descripcion || null,
    activa: payload.activa
  };
}

function matchesLocationSearch(location: Location, search: string) {
  const normalized = search.trim().toLowerCase();
  if (!normalized) return true;
  return (
    location.nombre.toLowerCase().includes(normalized) ||
    (location.descripcion ?? "").toLowerCase().includes(normalized)
  );
}

function collectDescendantIds(locations: Location[], locationId: number) {
  const descendants = new Set<number>();
  let changed = true;

  while (changed) {
    changed = false;
    for (const location of locations) {
      const parentId = location.ubicacionPadreId;
      if (parentId === locationId || (parentId !== null && descendants.has(parentId))) {
        if (!descendants.has(location.id)) {
          descendants.add(location.id);
          changed = true;
        }
      }
    }
  }

  return descendants;
}
