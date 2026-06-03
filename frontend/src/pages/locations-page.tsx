import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin, Plus, Trash2 } from "lucide-react";
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
  "OTRO"
];

interface LocationFormState {
  laboratorioId: string;
  ubicacionPadreId: string;
  nombre: string;
  tipo: TipoUbicacion;
  descripcion: string;
}

const initialForm: LocationFormState = {
  laboratorioId: "",
  ubicacionPadreId: "",
  nombre: "",
  tipo: "LABORATORIO",
  descripcion: ""
};

export function LocationsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<LocationFormState>(initialForm);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [laboratoryFilter, setLaboratoryFilter] = useState("");

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
        body: JSON.stringify({
          laboratorioId: Number(payload.laboratorioId),
          ubicacionPadreId: payload.ubicacionPadreId ? Number(payload.ubicacionPadreId) : undefined,
          nombre: payload.nombre,
          tipo: payload.tipo,
          descripcion: payload.descripcion || undefined,
          activa: true
        })
      }),
    onSuccess: async () => {
      setFeedback("Ubicacion creada correctamente.");
      setForm(initialForm);
      await queryClient.invalidateQueries({ queryKey: ["locations"] });
    },
    onError: (error) => setFeedback(error instanceof Error ? error.message : "No fue posible crear la ubicacion.")
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest<Location>(`/locations/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["locations"] });
    }
  });

  const locations = useMemo(() => locationsQuery.data?.data ?? [], [locationsQuery.data]);
  const laboratories = laboratoriesQuery.data?.data ?? [];
  const parentOptions = useMemo(
    () =>
      locations.filter(
        (location) =>
          !form.laboratorioId || location.laboratorioId === Number(form.laboratorioId)
      ),
    [form.laboratorioId, locations]
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    if (!form.laboratorioId) {
      setFeedback("Selecciona un laboratorio.");
      return;
    }
    createMutation.mutate(form);
  }

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
          onChange={(event) => setLaboratoryFilter(event.target.value)}
        >
          <option value="">Todos los laboratorios</option>
          {laboratories.map((laboratory) => (
            <option key={laboratory.id} value={laboratory.id}>
              {laboratory.codigo} - {laboratory.nombre}
            </option>
          ))}
        </select>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Ubicaciones registradas</CardTitle>
            {locationsQuery.isFetching && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Ubicacion</th>
                    <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                    <th className="px-4 py-3 text-left font-semibold">Laboratorio</th>
                    <th className="px-4 py-3 text-left font-semibold">Padre</th>
                    <th className="px-4 py-3 text-right font-semibold">Equipos</th>
                    <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {locations.map((location) => (
                    <tr key={location.id} className="border-t bg-white">
                      <td className="px-4 py-3">
                        <div className="font-medium">{location.nombre}</div>
                        <div className="text-xs text-muted-foreground">
                          {location.activa ? "Activa" : "Inactiva"}
                        </div>
                      </td>
                      <td className="px-4 py-3">{formatEnum(location.tipo)}</td>
                      <td className="px-4 py-3">
                        {location.laboratorio.codigo} - {location.laboratorio.nombre}
                      </td>
                      <td className="px-4 py-3">{location.ubicacionPadre?.nombre ?? "Sin padre"}</td>
                      <td className="px-4 py-3 text-right">
                        {location._count.equipos + location._count.unidades}
                      </td>
                      <td className="px-4 py-3 text-right">
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
                      </td>
                    </tr>
                  ))}
                  {!locations.length && (
                    <tr>
                      <td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>
                        No hay ubicaciones registradas.
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
              Nueva ubicacion
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
                      {laboratory.codigo} - {laboratory.nombre}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Ubicacion padre">
                <select
                  className="input-control"
                  value={form.ubicacionPadreId}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, ubicacionPadreId: event.target.value }))
                  }
                >
                  <option value="">Sin padre</option>
                  {parentOptions.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.nombre}
                    </option>
                  ))}
                </select>
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
                Crear ubicacion
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
