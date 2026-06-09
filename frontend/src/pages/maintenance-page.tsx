import { FormEvent, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Play, Search, ShieldAlert, Wrench, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { apiRequest } from "@/lib/api";
import { formatDateTime, formatEnum } from "@/lib/format";
import type { Equipment, EquipmentUnit, PaginatedResponse } from "@/types/inventory";
import type {
  EstadoCondicionEquipo,
  EstadoMantenimiento,
  MaintenanceRecord,
  PaginatedMaintenance,
  TipoMantenimiento
} from "@/types/maintenance";

interface MaintenanceFormState {
  equipoId: string;
  equipoUnidadId: string;
  tipoMantenimiento: TipoMantenimiento;
  descripcion: string;
  observaciones: string;
}

const initialForm: MaintenanceFormState = {
  equipoId: "",
  equipoUnidadId: "",
  tipoMantenimiento: "CORRECTIVO",
  descripcion: "",
  observaciones: ""
};

const maintenanceTypes: TipoMantenimiento[] = [
  "CORRECTIVO",
  "PREVENTIVO",
  "CALIBRACION",
  "REVISION",
  "OTRO"
];

const closeConditions: EstadoCondicionEquipo[] = [
  "BUENO",
  "REGULAR",
  "DANADO",
  "INCOMPLETO",
  "PERDIDO"
];

export function MaintenancePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedMaintenanceId, setSelectedMaintenanceId] = useState<number | null>(null);
  const [form, setForm] = useState<MaintenanceFormState>(initialForm);
  const [closeCondition, setCloseCondition] = useState<EstadoCondicionEquipo>("BUENO");
  const [closeNotes, setCloseNotes] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const maintenanceQuery = useQuery({
    queryKey: ["maintenance", search],
    queryFn: () =>
      apiRequest<PaginatedMaintenance>(
        `/maintenance?page=1&pageSize=50${search ? `&search=${encodeURIComponent(search)}` : ""}`
      )
  });

  const equipmentQuery = useQuery({
    queryKey: ["equipment"],
    queryFn: () => apiRequest<PaginatedResponse<Equipment>>("/equipment?page=1&pageSize=100")
  });

  const selectedEquipment = useMemo(
    () => equipmentQuery.data?.data.find((item) => String(item.id) === form.equipoId),
    [equipmentQuery.data, form.equipoId]
  );

  const unitsQuery = useQuery({
    queryKey: ["equipment-units", form.equipoId],
    enabled: Boolean(selectedEquipment?.requiereSerial && form.equipoId),
    queryFn: () => apiRequest<EquipmentUnit[]>(`/equipment/${form.equipoId}/units`)
  });

  const maintenance = useMemo(() => maintenanceQuery.data?.data ?? [], [maintenanceQuery.data]);
  const equipment = useMemo(() => equipmentQuery.data?.data ?? [], [equipmentQuery.data]);
  const selectedMaintenance =
    maintenance.find((item) => item.id === selectedMaintenanceId) ?? maintenance[0] ?? null;
  const equipmentOptions = useMemo(
    () =>
      equipment.map((item) => ({
        value: String(item.id),
        label: `${item.codigoInterno} - ${item.nombre} (${item.cantidadDisponible})`,
        description: item.categoria?.nombre,
        searchText: `${item.codigoInterno} ${item.codigoBarras ?? ""} ${item.nombre} ${item.categoria?.nombre ?? ""}`
      })),
    [equipment]
  );
  const unitOptions = useMemo(
    () =>
      (unitsQuery.data ?? [])
        .filter((unit) => unit.estado === "DISPONIBLE" || unit.estado === "DANADO")
        .map((unit) => ({
          value: String(unit.id),
          label: `${unit.codigoInterno}${unit.serial ? ` / ${unit.serial}` : ""}`,
          description: formatEnum(unit.estado),
          searchText: `${unit.codigoInterno} ${unit.serial ?? ""} ${unit.estado}`
        })),
    [unitsQuery.data]
  );
  const maintenanceTypeOptions = useMemo(
    () =>
      maintenanceTypes.map((type) => ({
        value: type,
        label: formatEnum(type),
        searchText: `${type} ${formatEnum(type)}`
      })),
    []
  );
  const closeConditionOptions = useMemo(
    () =>
      closeConditions.map((condition) => ({
        value: condition,
        label: formatEnum(condition),
        searchText: `${condition} ${formatEnum(condition)}`
      })),
    []
  );

  const summary = useMemo(
    () =>
      maintenance.reduce(
        (acc, item) => {
          acc.total += 1;
          if (item.estado === "ABIERTO") acc.abiertos += 1;
          if (item.estado === "EN_PROCESO") acc.enProceso += 1;
          if (item.estado === "FINALIZADO") acc.finalizados += 1;
          return acc;
        },
        { total: 0, abiertos: 0, enProceso: 0, finalizados: 0 }
      ),
    [maintenance]
  );

  const createMutation = useMutation({
    mutationFn: (payload: MaintenanceFormState) =>
      apiRequest<MaintenanceRecord>("/maintenance", {
        method: "POST",
        body: JSON.stringify({
          equipoId: Number(payload.equipoId),
          equipoUnidadId: payload.equipoUnidadId ? Number(payload.equipoUnidadId) : undefined,
          tipoMantenimiento: payload.tipoMantenimiento,
          descripcion: payload.descripcion,
          observaciones: payload.observaciones || undefined
        })
      }),
    onSuccess: async (record) => {
      setFeedback("Mantenimiento registrado.");
      setSelectedMaintenanceId(record.id);
      setForm(initialForm);
      await refreshOperationalData();
    },
    onError: setErrorFeedback
  });

  const startMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest<MaintenanceRecord>(`/maintenance/${id}/start`, {
        method: "PATCH"
      }),
    onSuccess: async (record) => {
      setFeedback("Mantenimiento iniciado.");
      setSelectedMaintenanceId(record.id);
      await refreshOperationalData();
    },
    onError: setErrorFeedback
  });

  const closeMutation = useMutation({
    mutationFn: ({ id, estadoSalida, observaciones }: { id: number; estadoSalida: EstadoCondicionEquipo; observaciones: string }) =>
      apiRequest<MaintenanceRecord>(`/maintenance/${id}/close`, {
        method: "PATCH",
        body: JSON.stringify({
          estadoSalida,
          observaciones: observaciones || undefined
        })
      }),
    onSuccess: async (record) => {
      setFeedback("Mantenimiento cerrado.");
      setSelectedMaintenanceId(record.id);
      setCloseCondition("BUENO");
      setCloseNotes("");
      await refreshOperationalData();
    },
    onError: setErrorFeedback
  });

  const cancelMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest<MaintenanceRecord>(`/maintenance/${id}/cancel`, {
        method: "PATCH"
      }),
    onSuccess: async (record) => {
      setFeedback("Mantenimiento cancelado.");
      setSelectedMaintenanceId(record.id);
      await refreshOperationalData();
    },
    onError: setErrorFeedback
  });

  async function refreshOperationalData() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["maintenance"] }),
      queryClient.invalidateQueries({ queryKey: ["equipment"] }),
      queryClient.invalidateQueries({ queryKey: ["inventory-movements"] })
    ]);
  }

  function setErrorFeedback(error: unknown) {
    setFeedback(error instanceof Error ? error.message : "No fue posible completar la accion.");
  }

  function updateForm<K extends keyof MaintenanceFormState>(key: K, value: MaintenanceFormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "equipoId" ? { equipoUnidadId: "" } : {})
    }));
  }

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    if (!form.equipoId) {
      setFeedback("Selecciona un equipo.");
      return;
    }
    if (selectedEquipment?.requiereSerial && !form.equipoUnidadId) {
      setFeedback("Selecciona la unidad fisica.");
      return;
    }
    if (form.descripcion.trim().length < 5) {
      setFeedback("Describe el motivo del mantenimiento.");
      return;
    }
    createMutation.mutate(form);
  }

  const pendingAction =
    createMutation.isPending ||
    startMutation.isPending ||
    closeMutation.isPending ||
    cancelMutation.isPending;

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Mantenimientos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registro, seguimiento y cierre de equipos enviados a mantenimiento.
          </p>
        </div>
        <div className="flex h-10 items-center gap-2 rounded-md border bg-white px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            className="h-full w-64 bg-transparent text-sm outline-none"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar mantenimiento"
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Registros" value={summary.total} icon={<Wrench className="h-4 w-4" />} />
        <Metric label="Abiertos" value={summary.abiertos} icon={<ShieldAlert className="h-4 w-4" />} />
        <Metric label="En proceso" value={summary.enProceso} icon={<Play className="h-4 w-4" />} />
        <Metric label="Finalizados" value={summary.finalizados} icon={<CheckCircle2 className="h-4 w-4" />} />
      </section>

      <section className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_430px]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Historial de mantenimiento</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {maintenanceQuery.data?.total ?? 0} registros encontrados
              </p>
            </div>
            {maintenanceQuery.isFetching && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[940px] text-sm">
                <thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                    <th className="px-4 py-3 text-left font-semibold">Equipo</th>
                    <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                    <th className="px-4 py-3 text-left font-semibold">Estado</th>
                    <th className="px-4 py-3 text-left font-semibold">Responsable</th>
                    <th className="px-4 py-3 text-left font-semibold">Descripcion</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenance.map((item) => (
                    <tr
                      key={item.id}
                      className="cursor-pointer border-t bg-white hover:bg-muted/30"
                      onClick={() => setSelectedMaintenanceId(item.id)}
                    >
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDateTime(item.fechaInicio)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.equipo.nombre}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.equipo.codigoInterno}
                          {item.equipoUnidad ? ` / ${item.equipoUnidad.codigoInterno}` : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3">{formatEnum(item.tipoMantenimiento)}</td>
                      <td className="px-4 py-3">
                        <span className={getMaintenanceBadgeClass(item.estado)}>
                          {formatEnum(item.estado)}
                        </span>
                      </td>
                      <td className="px-4 py-3">{item.responsable.nombre}</td>
                      <td className="px-4 py-3">{item.descripcion}</td>
                    </tr>
                  ))}
                  {!maintenance.length && (
                    <tr>
                      <td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>
                        No hay mantenimientos registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                Registrar mantenimiento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleCreate}>
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

                {selectedEquipment?.requiereSerial && (
                  <Field label="Unidad">
                    <SearchableSelect
                      options={unitOptions}
                      value={form.equipoUnidadId}
                      onChange={(value) => updateForm("equipoUnidadId", value)}
                      placeholder="Seleccionar unidad"
                      searchPlaceholder="Buscar por codigo, serial o estado"
                      emptyLabel="Seleccionar"
                      required
                    />
                  </Field>
                )}

                <Field label="Tipo">
                  <SearchableSelect
                    options={maintenanceTypeOptions}
                    value={form.tipoMantenimiento}
                    onChange={(value) => updateForm("tipoMantenimiento", value as TipoMantenimiento)}
                    placeholder="Seleccionar tipo"
                    searchPlaceholder="Buscar tipo de mantenimiento"
                    emptyLabel="Seleccionar"
                  />
                </Field>

                <Field label="Descripcion">
                  <textarea
                    className="textarea-control"
                    value={form.descripcion}
                    onChange={(event) => updateForm("descripcion", event.target.value)}
                    required
                  />
                </Field>

                <Field label="Observaciones">
                  <textarea
                    className="textarea-control"
                    value={form.observaciones}
                    onChange={(event) => updateForm("observaciones", event.target.value)}
                  />
                </Field>

                {feedback && (
                  <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                    {feedback}
                  </div>
                )}

                <Button className="w-full" type="submit" disabled={pendingAction}>
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
                  Registrar mantenimiento
                </Button>
              </form>
            </CardContent>
          </Card>

          {selectedMaintenance && (
            <Card>
              <CardHeader>
                <CardTitle>Detalle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{selectedMaintenance.equipo.nombre}</span>
                    <span className={getMaintenanceBadgeClass(selectedMaintenance.estado)}>
                      {formatEnum(selectedMaintenance.estado)}
                    </span>
                  </div>
                  <p className="mt-2 text-muted-foreground">{selectedMaintenance.descripcion}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Inicio: {formatDateTime(selectedMaintenance.fechaInicio)}
                  </p>
                  {selectedMaintenance.fechaFin && (
                    <p className="text-xs text-muted-foreground">
                      Cierre: {formatDateTime(selectedMaintenance.fechaFin)}
                    </p>
                  )}
                </div>

                {canOperate(selectedMaintenance.estado) && (
                  <div className="space-y-3">
                    {selectedMaintenance.estado === "ABIERTO" && (
                      <Button
                        className="w-full"
                        type="button"
                        onClick={() => startMutation.mutate(selectedMaintenance.id)}
                        disabled={pendingAction}
                      >
                        <Play className="h-4 w-4" />
                        Iniciar proceso
                      </Button>
                    )}

                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Estado de salida">
                        <SearchableSelect
                          options={closeConditionOptions}
                          value={closeCondition}
                          onChange={(value) => setCloseCondition(value as EstadoCondicionEquipo)}
                          placeholder="Seleccionar estado"
                          searchPlaceholder="Buscar estado"
                          emptyLabel="Seleccionar"
                        />
                      </Field>
                      <Field label="Notas cierre">
                        <input
                          className="input-control"
                          value={closeNotes}
                          onChange={(event) => setCloseNotes(event.target.value)}
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        onClick={() =>
                          closeMutation.mutate({
                            id: selectedMaintenance.id,
                            estadoSalida: closeCondition,
                            observaciones: closeNotes
                          })
                        }
                        disabled={pendingAction}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Cerrar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => cancelMutation.mutate(selectedMaintenance.id)}
                        disabled={pendingAction}
                      >
                        <XCircle className="h-4 w-4" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
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

function getMaintenanceBadgeClass(state: EstadoMantenimiento) {
  if (state === "ABIERTO") {
    return "badge badge-amber";
  }
  if (state === "EN_PROCESO") {
    return "badge badge-gray";
  }
  if (state === "FINALIZADO") {
    return "badge badge-green";
  }
  return "badge badge-red";
}

function canOperate(state: EstadoMantenimiento) {
  return state === "ABIERTO" || state === "EN_PROCESO";
}
