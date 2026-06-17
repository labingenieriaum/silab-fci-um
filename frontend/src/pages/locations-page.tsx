import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, ChevronLeft, DoorOpen, FlaskConical, Loader2, MapPin, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { LocationCombobox } from "@/components/location-combobox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { apiRequest } from "@/lib/api";
import { formatEnum } from "@/lib/format";
import { formatLocationPathById } from "@/lib/location-path";
import type { Equipment, Laboratory, Location, PaginatedResponse, TipoUbicacion } from "@/types/inventory";

const locationTypes: TipoUbicacion[] = [
  "EDIFICIO",
  "PISO",
  "LABORATORIO",
  "SALON",
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
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
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

  const equipmentQuery = useQuery({
    queryKey: ["equipment", "location-plan"],
    queryFn: () => apiRequest<PaginatedResponse<Equipment>>("/equipment?page=1&pageSize=100")
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
  const laboratories = useMemo(() => laboratoriesQuery.data?.data ?? [], [laboratoriesQuery.data]);
  const laboratoryOptions = useMemo(
    () =>
      laboratories.map((laboratory) => ({
        value: String(laboratory.id),
        label: `${laboratory.codigo} - ${laboratory.nombre}`,
        searchText: `${laboratory.codigo} ${laboratory.nombre} ${laboratory.facultad?.sigla ?? ""}`
      })),
    [laboratories]
  );

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

  const locationTypeOptions = useMemo(
    () =>
      locationTypes.map((type) => ({
        value: type,
        label: formatEnum(type),
        searchText: `${type} ${formatEnum(type)}`
      })),
    []
  );

  const equipment = useMemo(() => equipmentQuery.data?.data ?? [], [equipmentQuery.data]);
  const selectedLaboratory =
    laboratories.find((laboratory) => String(laboratory.id) === laboratoryFilter) ?? null;
  const selectedLocation = selectedLocationId
    ? locations.find((location) => location.id === selectedLocationId) ?? null
    : null;
  const currentChildren = useMemo(
    () =>
      locations
        .filter((location) => {
          if (selectedLocationId) return location.ubicacionPadreId === selectedLocationId;
          if (!laboratoryFilter) return false;
          return location.laboratorioId === Number(laboratoryFilter) && !location.ubicacionPadreId;
        })
        .filter((location) => matchesLocationSearch(location, locationSearch)),
    [laboratoryFilter, locationSearch, locations, selectedLocationId]
  );
  const directEquipment = useMemo(
    () =>
      selectedLocationId
        ? equipment.filter((item) => Number(item.ubicacionId) === selectedLocationId)
        : [],
    [equipment, selectedLocationId]
  );
  const breadcrumbs = useMemo(
    () => (selectedLocation ? buildLocationBreadcrumbs(selectedLocation, locations) : []),
    [locations, selectedLocation]
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
        <SearchableSelect
          className="max-w-xs"
          options={laboratoryOptions}
          value={laboratoryFilter}
          onChange={(value) => {
            setLaboratoryFilter(value);
            setSelectedLocationId(null);
          }}
          placeholder="Todos los laboratorios"
          searchPlaceholder="Buscar por codigo o nombre"
          emptyLabel="Todos los laboratorios"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_430px]">
        <Card className="overflow-hidden">
          <CardHeader className="space-y-4 border-b bg-gradient-to-br from-[#103c24] via-[#164a2d] to-[#1d5d38] text-white">
            <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
              <div>
                <CardTitle className="flex items-center gap-2 text-white">
                  <DoorOpen className="h-5 w-5 text-[#a9cf64]" />
                  Plano de laboratorios y ubicaciones
                </CardTitle>
                <p className="mt-1 text-sm text-white/75">
                  Navega por espacios, sububicaciones y equipos guardados en cada punto.
                </p>
              </div>
              {(locationsQuery.isFetching || equipmentQuery.isFetching) && (
                <Loader2 className="h-4 w-4 animate-spin text-[#a9cf64]" />
              )}
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="flex h-10 items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3">
                <Search className="h-4 w-4 text-white/70" />
                <input
                  className="h-full w-full bg-transparent text-sm text-white outline-none placeholder:text-white/55"
                  value={locationSearch}
                  onChange={(event) => setLocationSearch(event.target.value)}
                  placeholder="Buscar ubicacion en este nivel"
                />
              </div>
              {selectedLocation && (
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/25 bg-white/10 text-white hover:bg-white/20"
                  onClick={() => setSelectedLocationId(selectedLocation.ubicacionPadreId)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Volver
                </Button>
              )}
            </div>
            {equipmentQuery.isError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                No fue posible cargar los equipos para este plano.
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-5 bg-[#f4f7f2] p-4 dark:bg-background">
            {!selectedLaboratory ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {laboratories.map((laboratory) => (
                  <button
                    key={laboratory.id}
                    type="button"
                    className="group min-h-36 rounded-md border-2 border-[#d5dfd2] bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
                    onClick={() => {
                      setLaboratoryFilter(String(laboratory.id));
                      setSelectedLocationId(null);
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="grid h-12 w-12 place-items-center rounded-md bg-[#173f28] text-white">
                        <FlaskConical className="h-6 w-6" />
                      </span>
                      <span className="rounded-md bg-[#a9cf64] px-2 py-1 text-xs font-bold text-[#14351f]">
                        {laboratory.codigo}
                      </span>
                    </div>
                    <h3 className="mt-4 text-lg font-semibold">{laboratory.nombre}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{laboratory.facultad.sigla}</p>
                    <p className="mt-3 text-xs font-medium text-primary">
                      {laboratory._count.ubicaciones} ubicaciones registradas
                    </p>
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="rounded-md border bg-card p-4">
                  <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-primary">
                        {selectedLaboratory.codigo}
                      </p>
                      <h2 className="text-xl font-semibold">
                        {selectedLocation?.nombre ?? selectedLaboratory.nombre}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {selectedLocation
                          ? `${formatEnum(selectedLocation.tipo)} - ${selectedLocation.descripcion || "Sin descripcion"}`
                          : selectedLaboratory.descripcion || "Selecciona una ubicacion para entrar al detalle."}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setLaboratoryFilter("");
                        setSelectedLocationId(null);
                      }}
                    >
                      Cambiar laboratorio
                    </Button>
                  </div>
                  {breadcrumbs.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <button
                        type="button"
                        className="rounded-md border bg-muted px-2 py-1 font-medium"
                        onClick={() => setSelectedLocationId(null)}
                      >
                        {selectedLaboratory.nombre}
                      </button>
                      {breadcrumbs.map((location) => (
                        <button
                          key={location.id}
                          type="button"
                          className="rounded-md border bg-background px-2 py-1 font-medium"
                          onClick={() => setSelectedLocationId(location.id)}
                        >
                          {location.nombre}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-md border-2 border-dashed border-[#b9c8b5] bg-[#edf3ea] p-4 dark:bg-card">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-semibold">Ubicaciones dentro de este espacio</h3>
                    <span className="text-xs text-muted-foreground">{currentChildren.length} espacios</span>
                  </div>
                  <div className="grid auto-rows-fr gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {currentChildren.map((location) => {
                      const equipmentInScope = countEquipmentInLocationScope(location.id, equipment, locations);
                      return (
                      <div
                        key={location.id}
                        className="group relative min-h-36 cursor-pointer rounded-md border-2 border-[#c9d8c4] bg-card p-4 shadow-sm transition hover:border-primary hover:shadow-md"
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedLocationId(location.id)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedLocationId(location.id);
                          }
                        }}
                      >
                        <div className="relative flex h-full flex-col">
                          <div className="flex items-start justify-between gap-3">
                            <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                              {formatEnum(location.tipo)}
                            </span>
                            <div className="flex gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="relative z-10 h-8 w-8"
                                aria-label="Editar ubicacion"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  startEdit(location);
                                }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="relative z-10 h-8 w-8"
                                aria-label="Eliminar ubicacion"
                                disabled={
                                  deleteMutation.isPending ||
                                  location._count.sububicaciones + location._count.equipos + location._count.unidades > 0
                                }
                                onClick={(event) => {
                                  event.stopPropagation();
                                  deleteMutation.mutate(location.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <h4 className="mt-4 text-lg font-semibold">{location.nombre}</h4>
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {location.descripcion || "Sin descripcion"}
                          </p>
                          <div className="mt-auto flex flex-wrap gap-2 pt-4 text-xs">
                            <span className="rounded-md bg-muted px-2 py-1">
                              {location._count.sububicaciones} sububicaciones
                            </span>
                            <span className="rounded-md bg-muted px-2 py-1">
                              {equipmentInScope} equipos
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                    })}
                    {!currentChildren.length && (
                      <div className="rounded-md border bg-card px-4 py-8 text-center text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">
                        No hay ubicaciones hijas en este nivel.
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-md border bg-card p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="flex items-center gap-2 font-semibold">
                      <Boxes className="h-4 w-4 text-primary" />
                      Equipos guardados en esta ubicacion
                    </h3>
                    <span className="text-xs text-muted-foreground">{directEquipment.length} equipos</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {directEquipment.map((item) => (
                      <div key={item.id} className="rounded-md border bg-background p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="font-semibold">{item.nombre}</h4>
                            <p className="text-xs text-muted-foreground">{item.codigoInterno}</p>
                          </div>
                          <span className="rounded-md bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                            {item.cantidadDisponible}/{item.cantidadTotal}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {item.categoria.nombre} - {formatEnum(item.estado)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatLocationPathById(item.ubicacionId, locations, item.ubicacion.nombre)}
                        </p>
                      </div>
                    ))}
                    {!selectedLocationId && (
                      <div className="rounded-md border bg-background px-4 py-6 text-center text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">
                        Entra a una ubicacion para ver los equipos guardados en ese punto.
                      </div>
                    )}
                    {selectedLocationId && !directEquipment.length && (
                      <div className="rounded-md border bg-background px-4 py-6 text-center text-sm text-muted-foreground sm:col-span-2 xl:col-span-3">
                        No hay equipos guardados directamente en esta ubicacion.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
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
                <SearchableSelect
                  options={laboratoryOptions}
                  value={form.laboratorioId}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      laboratorioId: value,
                      ubicacionPadreId: ""
                    }))
                  }
                  placeholder="Seleccionar laboratorio"
                  searchPlaceholder="Buscar por codigo o nombre"
                  emptyLabel="Seleccionar"
                  required
                />
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
                  <SearchableSelect
                    options={locationTypeOptions}
                    value={form.tipo}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        tipo: value as TipoUbicacion
                      }))
                    }
                    placeholder="Seleccionar tipo"
                    searchPlaceholder="Buscar tipo de ubicacion"
                    emptyLabel="Seleccionar"
                  />
                </Field>
              </div>

              {editingLocationId && (
                <label className="flex h-10 items-center gap-2 rounded-md border bg-card px-3 text-sm font-medium">
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

function buildLocationBreadcrumbs(location: Location, locations: Location[]) {
  const byId = new Map(locations.map((item) => [item.id, item]));
  const chain: Location[] = [];
  const visited = new Set<number>();
  let cursor: Location | undefined = location;

  while (cursor && !visited.has(cursor.id)) {
    visited.add(cursor.id);
    chain.unshift(cursor);
    cursor = cursor.ubicacionPadreId ? byId.get(cursor.ubicacionPadreId) : undefined;
  }

  return chain;
}

function locationContainsEquipment(locationId: number, equipment: Equipment, locations: Location[]) {
  const equipmentLocationId = Number(equipment.ubicacionId);
  if (equipmentLocationId === locationId) {
    return true;
  }
  const descendantIds = collectDescendantIds(locations, locationId);
  return descendantIds.has(equipmentLocationId);
}

function countEquipmentInLocationScope(locationId: number, equipment: Equipment[], locations: Location[]) {
  return equipment.filter((item) => locationContainsEquipment(locationId, item, locations)).length;
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
