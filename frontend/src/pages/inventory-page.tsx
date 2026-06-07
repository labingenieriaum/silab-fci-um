import { FormEvent, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRightLeft, Boxes, ClipboardList, Loader2, Plus, RotateCw } from "lucide-react";
import { LocationCombobox } from "@/components/location-combobox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { apiRequest } from "@/lib/api";
import { formatDateTime, formatEnum } from "@/lib/format";
import { formatLocationPathById } from "@/lib/location-path";
import type {
  Equipment,
  InventoryMovement,
  Location,
  PaginatedResponse,
  TipoMovimiento
} from "@/types/inventory";

type MovementAction = "ENTRADA" | "AJUSTE_POSITIVO" | "AJUSTE_NEGATIVO" | "BAJA" | "TRASLADO";

interface MovementFormState {
  action: MovementAction;
  equipoId: string;
  cantidad: string;
  ubicacionDestinoId: string;
  descripcion: string;
}

const initialForm: MovementFormState = {
  action: "ENTRADA",
  equipoId: "",
  cantidad: "1",
  ubicacionDestinoId: "",
  descripcion: ""
};

const movementActions: Array<{
  value: MovementAction;
  label: string;
  description: string;
}> = [
  {
    value: "ENTRADA",
    label: "Entrada",
    description: "Suma nuevas unidades disponibles al equipo. Usalo cuando ingresa inventario nuevo."
  },
  {
    value: "AJUSTE_POSITIVO",
    label: "Ajuste positivo",
    description: "Corrige el conteo aumentando disponibilidad sin registrar una compra o ingreso formal."
  },
  {
    value: "AJUSTE_NEGATIVO",
    label: "Ajuste negativo",
    description: "Corrige el conteo reduciendo disponibilidad por diferencia fisica de inventario."
  },
  {
    value: "BAJA",
    label: "Baja",
    description: "Retira unidades disponibles por descarte, perdida administrativa u obsolescencia."
  },
  {
    value: "TRASLADO",
    label: "Traslado",
    description: "Mueve el equipo a otra ubicacion fisica. Requiere indicar la nueva ubicacion."
  }
];

export function InventoryPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<MovementFormState>(initialForm);
  const [feedback, setFeedback] = useState<string | null>(null);

  const equipmentQuery = useQuery({
    queryKey: ["equipment"],
    queryFn: () => apiRequest<PaginatedResponse<Equipment>>("/equipment?page=1&pageSize=100")
  });

  const movementsQuery = useQuery({
    queryKey: ["inventory-movements"],
    queryFn: () =>
      apiRequest<PaginatedResponse<InventoryMovement>>("/inventory-movements?page=1&pageSize=30")
  });

  const locationsQuery = useQuery({
    queryKey: ["locations"],
    queryFn: () => apiRequest<PaginatedResponse<Location>>("/locations?page=1&pageSize=100")
  });

  const movementMutation = useMutation({
    mutationFn: async (payload: MovementFormState) => {
      const base = {
        equipoId: Number(payload.equipoId),
        cantidad: Number(payload.cantidad),
        descripcion: payload.descripcion || undefined
      };

      if (payload.action === "ENTRADA") {
        return apiRequest("/inventory-movements/entry", {
          method: "POST",
          body: JSON.stringify({
            ...base,
            ubicacionDestinoId: payload.ubicacionDestinoId
              ? Number(payload.ubicacionDestinoId)
              : undefined
          })
        });
      }

      if (payload.action === "TRASLADO") {
        return apiRequest("/inventory-movements/transfer", {
          method: "POST",
          body: JSON.stringify({
            ...base,
            ubicacionDestinoId: Number(payload.ubicacionDestinoId)
          })
        });
      }

      return apiRequest("/inventory-movements/adjustment", {
        method: "POST",
        body: JSON.stringify({
          ...base,
          tipoMovimiento: payload.action
        })
      });
    },
    onSuccess: async () => {
      setFeedback("Movimiento registrado correctamente.");
      setForm(initialForm);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["equipment"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory-movements"] })
      ]);
    },
    onError: (error) => setFeedback(error instanceof Error ? error.message : "No fue posible registrar el movimiento.")
  });

  const equipment = useMemo(() => equipmentQuery.data?.data ?? [], [equipmentQuery.data]);
  const movements = useMemo(() => movementsQuery.data?.data ?? [], [movementsQuery.data]);
  const locations = useMemo(() => locationsQuery.data?.data ?? [], [locationsQuery.data]);
  const equipmentOptions = useMemo(
    () =>
      equipment.map((item) => ({
        value: String(item.id),
        label: `${item.codigoInterno} - ${item.nombre}`,
        description: item.categoria.nombre,
        searchText: `${item.codigoInterno} ${item.codigoBarras ?? ""} ${item.nombre} ${item.categoria.nombre}`
      })),
    [equipment]
  );
  const movementActionOptions = useMemo(
    () =>
      movementActions.map((action) => ({
        value: action.value,
        label: action.label,
        description: action.description,
        searchText: `${action.label} ${action.description}`
      })),
    []
  );
  const selectedAction = movementActions.find((action) => action.value === form.action);

  const summary = useMemo(
    () =>
      equipment.reduce(
        (acc, item) => {
          acc.equipos += 1;
          acc.items += item.cantidadTotal;
          acc.disponibles += item.cantidadDisponible;
          acc.alertas += item.cantidadMantenimiento + item.cantidadBaja;
          return acc;
        },
        { equipos: 0, items: 0, disponibles: 0, alertas: 0 }
      ),
    [equipment]
  );

  function updateForm<K extends keyof MovementFormState>(key: K, value: MovementFormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "action" ? { ubicacionDestinoId: "" } : {})
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    if (!form.equipoId) {
      setFeedback("Selecciona un equipo.");
      return;
    }
    if (form.action === "TRASLADO" && !form.ubicacionDestinoId) {
      setFeedback("Selecciona ubicacion destino para el traslado.");
      return;
    }
    movementMutation.mutate(form);
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal">Inventario</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Control operativo de existencias, entradas, ajustes, bajas y traslados.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Equipos" value={summary.equipos} icon={<Boxes className="h-4 w-4" />} />
        <Metric label="Items totales" value={summary.items} icon={<ClipboardList className="h-4 w-4" />} />
        <Metric label="Disponibles" value={summary.disponibles} icon={<Plus className="h-4 w-4" />} />
        <Metric label="Alertas stock" value={summary.alertas} icon={<RotateCw className="h-4 w-4" />} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Movimientos recientes</CardTitle>
            {movementsQuery.isFetching && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[860px] text-sm">
                <thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                    <th className="px-4 py-3 text-left font-semibold">Equipo</th>
                    <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                    <th className="px-4 py-3 text-right font-semibold">Cantidad</th>
                    <th className="px-4 py-3 text-left font-semibold">Ubicacion</th>
                    <th className="px-4 py-3 text-left font-semibold">Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((movement) => (
                    <tr key={movement.id} className="border-t bg-white">
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDateTime(movement.fecha)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{movement.equipo.nombre}</div>
                        <div className="text-xs text-muted-foreground">
                          {movement.equipo.codigoInterno}
                          {movement.equipoUnidad ? ` / ${movement.equipoUnidad.codigoInterno}` : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={getMovementBadgeClass(movement.tipoMovimiento)}>
                          {formatEnum(movement.tipoMovimiento)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">{movement.cantidad}</td>
                      <td className="px-4 py-3">
                        <div>
                          {formatLocationPathById(
                            movement.ubicacionDestinoId ?? movement.ubicacionOrigenId,
                            locations,
                            movement.ubicacionDestino?.nombre ??
                              movement.ubicacionOrigen?.nombre ??
                              "Sin ubicacion"
                          )}
                        </div>
                        {movement.ubicacionOrigenId && movement.ubicacionDestinoId && (
                          <div className="text-xs text-muted-foreground">
                            Desde{" "}
                            {formatLocationPathById(
                              movement.ubicacionOrigenId,
                              locations,
                              movement.ubicacionOrigen?.nombre ?? "Sin ubicacion"
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">{movement.usuario.nombre}</td>
                    </tr>
                  ))}
                  {!movements.length && (
                    <tr>
                      <td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>
                        No hay movimientos registrados.
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
              <ArrowRightLeft className="h-4 w-4 text-primary" />
              Registrar movimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Field label="Equipo">
                <SearchableSelect
                  options={equipmentOptions}
                  value={form.equipoId}
                  onChange={(value) => updateForm("equipoId", value)}
                  placeholder="Seleccionar equipo"
                  searchPlaceholder="Buscar por nombre, codigo o categoria"
                  emptyLabel="Seleccionar"
                  required
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Tipo">
                  <SearchableSelect
                    options={movementActionOptions}
                    value={form.action}
                    onChange={(value) => updateForm("action", value as MovementAction)}
                    placeholder="Seleccionar tipo"
                    searchPlaceholder="Buscar tipo de movimiento"
                    emptyLabel="Seleccionar"
                  />
                </Field>
                <Field label="Cantidad">
                  <input
                    className="input-control"
                    type="number"
                    min="1"
                    value={form.cantidad}
                    onChange={(event) => updateForm("cantidad", event.target.value)}
                    required
                  />
                </Field>
              </div>

              {selectedAction && (
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{selectedAction.label}:</span>{" "}
                  {selectedAction.description}
                </div>
              )}

              {(form.action === "ENTRADA" || form.action === "TRASLADO") && (
                <Field label={form.action === "TRASLADO" ? "Nueva ubicacion del equipo" : "Ubicacion de ingreso"}>
                  <LocationCombobox
                    locations={locations}
                    value={form.ubicacionDestinoId}
                    onChange={(value) => updateForm("ubicacionDestinoId", value)}
                    placeholder={
                      form.action === "TRASLADO" ? "Seleccionar nueva ubicacion" : "Usar ubicacion actual"
                    }
                    emptyLabel={form.action === "TRASLADO" ? "Seleccionar nueva ubicacion" : "Usar ubicacion actual"}
                    searchPlaceholder="Buscar por ruta, laboratorio o padre"
                    required={form.action === "TRASLADO"}
                  />
                  {form.action === "TRASLADO" && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Esta sera la ubicacion fisica nueva del equipo seleccionado.
                    </p>
                  )}
                </Field>
              )}

              <Field label="Descripcion">
                <textarea
                  className="textarea-control"
                  value={form.descripcion}
                  onChange={(event) => updateForm("descripcion", event.target.value)}
                />
              </Field>

              {feedback && (
                <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                  {feedback}
                </div>
              )}
              <Button className="w-full" type="submit" disabled={movementMutation.isPending}>
                {movementMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
                Registrar movimiento
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
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

function getMovementBadgeClass(type: TipoMovimiento) {
  if (type === "ENTRADA" || type === "AJUSTE_POSITIVO" || type === "DEVOLUCION") {
    return "badge badge-green";
  }
  if (type === "TRASLADO" || type === "PRESTAMO") {
    return "badge badge-amber";
  }
  if (type === "BAJA" || type === "AJUSTE_NEGATIVO") {
    return "badge badge-red";
  }
  return "badge badge-gray";
}
