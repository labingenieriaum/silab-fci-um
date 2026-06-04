import { FormEvent, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Barcode,
  Boxes,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  QrCode,
  Save,
  Search,
  Trash2,
  Wrench,
  X,
  XCircle
} from "lucide-react";
import { LocationCombobox } from "@/components/location-combobox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { apiRequest } from "@/lib/api";
import { formatEnum } from "@/lib/format";
import type {
  Equipment,
  EquipmentCategory,
  Location,
  PaginatedResponse
} from "@/types/inventory";

interface UnitFormState {
  codigoInterno: string;
  serial: string;
  observaciones: string;
}

interface EquipmentFormState {
  categoriaId: string;
  ubicacionId: string;
  codigoInterno: string;
  codigoBarras: string;
  nombre: string;
  marca: string;
  modelo: string;
  requiereSerial: boolean;
  cantidadTotal: string;
  valorEstimado: string;
  observaciones: string;
  unidades: UnitFormState[];
}

const initialForm: EquipmentFormState = {
  categoriaId: "",
  ubicacionId: "",
  codigoInterno: "",
  codigoBarras: "",
  nombre: "",
  marca: "",
  modelo: "",
  requiereSerial: false,
  cantidadTotal: "1",
  valorEstimado: "0",
  observaciones: "",
  unidades: []
};

export function EquipmentPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<EquipmentFormState>(initialForm);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const equipmentQuery = useQuery({
    queryKey: ["equipment", search],
    queryFn: () =>
      apiRequest<PaginatedResponse<Equipment>>(
        `/equipment?page=1&pageSize=50${search ? `&search=${encodeURIComponent(search)}` : ""}`
      )
  });

  const categoriesQuery = useQuery({
    queryKey: ["equipment-categories"],
    queryFn: () => apiRequest<EquipmentCategory[]>("/equipment-categories")
  });

  const locationsQuery = useQuery({
    queryKey: ["locations"],
    queryFn: () => apiRequest<PaginatedResponse<Location>>("/locations?page=1&pageSize=100")
  });

  const createMutation = useMutation({
    mutationFn: (payload: EquipmentFormState) =>
      apiRequest<Equipment>("/equipment", {
        method: "POST",
        body: JSON.stringify({
          categoriaId: Number(payload.categoriaId),
          ubicacionId: Number(payload.ubicacionId),
          codigoInterno: payload.codigoInterno,
          codigoBarras: payload.codigoBarras || undefined,
          nombre: payload.nombre,
          marca: payload.marca || undefined,
          modelo: payload.modelo || undefined,
          requiereSerial: payload.requiereSerial,
          cantidadTotal: Number(payload.cantidadTotal),
          valorEstimado: Number(payload.valorEstimado || 0),
          observaciones: payload.observaciones || undefined,
          unidades: payload.requiereSerial
            ? payload.unidades.map((unit) => ({
                codigoInterno: unit.codigoInterno,
                serial: unit.serial || undefined,
                ubicacionId: Number(payload.ubicacionId),
                observaciones: unit.observaciones || undefined
              }))
            : undefined
        })
      }),
    onSuccess: async () => {
      setFeedback("Equipo registrado correctamente.");
      setForm(initialForm);
      await queryClient.invalidateQueries({ queryKey: ["equipment"] });
      await queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
    },
    onError: (error) => setFeedback(error instanceof Error ? error.message : "No fue posible crear el equipo.")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: EquipmentFormState }) =>
      apiRequest<Equipment>(`/equipment/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          categoriaId: Number(payload.categoriaId),
          ubicacionId: Number(payload.ubicacionId),
          codigoInterno: payload.codigoInterno,
          codigoBarras: payload.codigoBarras,
          nombre: payload.nombre,
          marca: payload.marca,
          modelo: payload.modelo,
          valorEstimado: Number(payload.valorEstimado || 0),
          observaciones: payload.observaciones
        })
      }),
    onSuccess: async () => {
      setFeedback("Equipo actualizado correctamente.");
      setEditingEquipment(null);
      setForm(initialForm);
      await queryClient.invalidateQueries({ queryKey: ["equipment"] });
      await queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
    },
    onError: (error) =>
      setFeedback(error instanceof Error ? error.message : "No fue posible actualizar el equipo.")
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest<Equipment>(`/equipment/${id}`, { method: "DELETE" }),
    onSuccess: async (_, id) => {
      if (editingEquipment?.id === id) {
        setEditingEquipment(null);
        setForm(initialForm);
      }
      setFeedback("Equipo eliminado correctamente.");
      await queryClient.invalidateQueries({ queryKey: ["equipment"] });
      await queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
    },
    onError: (error) =>
      setFeedback(error instanceof Error ? error.message : "No fue posible eliminar el equipo.")
  });

  const equipment = useMemo(() => equipmentQuery.data?.data ?? [], [equipmentQuery.data]);
  const categories = categoriesQuery.data ?? [];
  const locations = useMemo(() => locationsQuery.data?.data ?? [], [locationsQuery.data]);
  const isEditing = editingEquipment !== null;
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const summary = useMemo(
    () =>
      equipment.reduce(
        (acc, item) => {
          acc.total += item.cantidadTotal;
          acc.disponible += item.cantidadDisponible;
          acc.prestado += item.cantidadPrestada;
          acc.mantenimiento += item.cantidadMantenimiento;
          return acc;
        },
        { total: 0, disponible: 0, prestado: 0, mantenimiento: 0 }
      ),
    [equipment]
  );

  function updateForm<K extends keyof EquipmentFormState>(key: K, value: EquipmentFormState[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if (key === "cantidadTotal" || key === "requiereSerial") {
        return syncUnitRows(next);
      }
      return next;
    });
  }

  function updateUnit(index: number, key: keyof UnitFormState, value: string) {
    setForm((current) => ({
      ...current,
      unidades: current.unidades.map((unit, unitIndex) =>
        unitIndex === index ? { ...unit, [key]: value } : unit
      )
    }));
  }

  function beginEdit(item: Equipment) {
    setFeedback(null);
    setEditingEquipment(item);
    setForm({
      categoriaId: String(item.categoriaId),
      ubicacionId: String(item.ubicacionId),
      codigoInterno: item.codigoInterno,
      codigoBarras: item.codigoBarras ?? "",
      nombre: item.nombre,
      marca: item.marca ?? "",
      modelo: item.modelo ?? "",
      requiereSerial: item.requiereSerial,
      cantidadTotal: String(item.cantidadTotal),
      valorEstimado: String(item.valorEstimado ?? 0),
      observaciones: item.observaciones ?? "",
      unidades: []
    });
  }

  function cancelEdit() {
    setEditingEquipment(null);
    setForm(initialForm);
    setFeedback(null);
  }

  function handleDelete(item: Equipment) {
    const confirmed = window.confirm(`Eliminar el equipo ${item.codigoInterno} - ${item.nombre}?`);
    if (confirmed) {
      deleteMutation.mutate(item.id);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    if (!form.categoriaId || !form.ubicacionId) {
      setFeedback("Selecciona categoria y ubicacion.");
      return;
    }
    if (!isEditing && form.requiereSerial && form.unidades.some((unit) => !unit.codigoInterno.trim())) {
      setFeedback("Cada unidad serializada requiere codigo interno.");
      return;
    }
    if (editingEquipment) {
      updateMutation.mutate({ id: editingEquipment.id, payload: form });
      return;
    }
    createMutation.mutate(form);
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Equipos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registro de equipos, cantidades, estados, seriales y ubicacion responsable.
          </p>
        </div>
        <div className="flex h-10 items-center gap-2 rounded-md border bg-white px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            className="h-full w-64 bg-transparent text-sm outline-none"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por equipo, barras o QR"
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Items totales" value={summary.total} icon={<Boxes className="h-4 w-4" />} />
        <Metric label="Disponibles" value={summary.disponible} icon={<CheckCircle2 className="h-4 w-4" />} />
        <Metric label="Prestados" value={summary.prestado} icon={<XCircle className="h-4 w-4" />} />
        <Metric label="Mantenimiento" value={summary.mantenimiento} icon={<Wrench className="h-4 w-4" />} />
      </section>

      <section className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_460px]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Inventario de equipos</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {equipmentQuery.data?.total ?? 0} registros encontrados
              </p>
            </div>
            {equipmentQuery.isFetching && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[1180px] text-sm">
                <thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Equipo</th>
                    <th className="px-4 py-3 text-left font-semibold">Categoria</th>
                    <th className="px-4 py-3 text-left font-semibold">Ubicacion</th>
                    <th className="px-4 py-3 text-right font-semibold">Total</th>
                    <th className="px-4 py-3 text-right font-semibold">Disponible</th>
                    <th className="px-4 py-3 text-right font-semibold">Prestado</th>
                    <th className="px-4 py-3 text-right font-semibold">Manto.</th>
                    <th className="px-4 py-3 text-left font-semibold">Estado</th>
                    <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {equipment.map((item) => (
                    <tr key={item.id} className="border-t bg-white">
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.nombre}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.codigoInterno}
                          {item.requiereSerial ? ` - ${item._count.unidades} unidades` : ""}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1 text-xs text-muted-foreground">
                          {item.codigoBarras && (
                            <span className="inline-flex items-center gap-1 rounded-md border bg-muted/40 px-2 py-1">
                              <Barcode className="h-3 w-3" />
                              Barras: {item.codigoBarras}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 rounded-md border bg-muted/40 px-2 py-1">
                            <QrCode className="h-3 w-3" />
                            QR: {getShortQrToken(item.qrToken)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {[item.marca, item.modelo].filter(Boolean).join(" ") || "Sin marca/modelo"}
                        </div>
                      </td>
                      <td className="px-4 py-3">{item.categoria.nombre}</td>
                      <td className="px-4 py-3">
                        <div>{item.ubicacion.nombre}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.ubicacion.laboratorio.codigo} - {item.ubicacion.laboratorio.nombre}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">{item.cantidadTotal}</td>
                      <td className="px-4 py-3 text-right">{item.cantidadDisponible}</td>
                      <td className="px-4 py-3 text-right">{item.cantidadPrestada}</td>
                      <td className="px-4 py-3 text-right">{item.cantidadMantenimiento}</td>
                      <td className="px-4 py-3">
                        <span className={getStateBadgeClass(item.estado)}>{formatEnum(item.estado)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Editar equipo"
                            onClick={() => beginEdit(item)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Eliminar equipo"
                            disabled={deleteMutation.isPending}
                            onClick={() => handleDelete(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!equipment.length && (
                    <tr>
                      <td className="px-4 py-8 text-center text-muted-foreground" colSpan={9}>
                        No hay equipos registrados para los filtros actuales.
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
              {isEditing ? (
                <Pencil className="h-4 w-4 text-primary" />
              ) : (
                <Plus className="h-4 w-4 text-primary" />
              )}
              {isEditing ? "Editar equipo" : "Registrar equipo"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Categoria">
                  <select
                    className="input-control"
                    value={form.categoriaId}
                    onChange={(event) => updateForm("categoriaId", event.target.value)}
                    required
                  >
                    <option value="">Seleccionar</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.nombre}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Ubicacion">
                  <LocationCombobox
                    locations={locations}
                    value={form.ubicacionId}
                    onChange={(value) => updateForm("ubicacionId", value)}
                    placeholder="Seleccionar"
                    emptyLabel="Seleccionar"
                    required
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Codigo interno">
                  <input
                    className="input-control"
                    value={form.codigoInterno}
                    onChange={(event) => updateForm("codigoInterno", event.target.value)}
                    required
                  />
                </Field>
                <Field label="Codigo de barras">
                  <input
                    className="input-control"
                    value={form.codigoBarras}
                    onChange={(event) => updateForm("codigoBarras", event.target.value)}
                    placeholder="Opcional"
                  />
                </Field>
              </div>

              <div className="grid gap-3">
                <Field label="Nombre">
                  <input
                    className="input-control"
                    value={form.nombre}
                    onChange={(event) => updateForm("nombre", event.target.value)}
                    required
                  />
                </Field>
              </div>

              {editingEquipment && (
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    <QrCode className="h-4 w-4 text-primary" />
                    QR del equipo
                  </div>
                  <code className="mt-2 block break-all rounded-md bg-white px-2 py-1">
                    {getQrPayload(editingEquipment.qrToken)}
                  </code>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Marca">
                  <input
                    className="input-control"
                    value={form.marca}
                    onChange={(event) => updateForm("marca", event.target.value)}
                  />
                </Field>
                <Field label="Modelo">
                  <input
                    className="input-control"
                    value={form.modelo}
                    onChange={(event) => updateForm("modelo", event.target.value)}
                  />
                </Field>
                <Field label="Valor estimado">
                  <input
                    className="input-control"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.valorEstimado}
                    onChange={(event) => updateForm("valorEstimado", event.target.value)}
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_150px] sm:items-end">
                <label className="flex h-10 items-center gap-2 rounded-md border bg-white px-3 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.requiereSerial}
                    disabled={isEditing}
                    onChange={(event) => updateForm("requiereSerial", event.target.checked)}
                  />
                  Requiere serial
                </label>
                <Field label="Cantidad">
                  <input
                    className="input-control"
                    type="number"
                    min="1"
                    value={form.cantidadTotal}
                    disabled={isEditing}
                    onChange={(event) => updateForm("cantidadTotal", event.target.value)}
                    required
                  />
                </Field>
              </div>

              {!isEditing && form.requiereSerial && (
                <div className="space-y-3 rounded-md border bg-muted/30 p-3">
                  <p className="text-sm font-medium">Unidades serializadas</p>
                  {form.unidades.map((unit, index) => (
                    <div key={index} className="grid gap-2 sm:grid-cols-3">
                      <input
                        className="input-control"
                        placeholder={`Codigo unidad ${index + 1}`}
                        value={unit.codigoInterno}
                        onChange={(event) => updateUnit(index, "codigoInterno", event.target.value)}
                        required
                      />
                      <input
                        className="input-control"
                        placeholder="Serial"
                        value={unit.serial}
                        onChange={(event) => updateUnit(index, "serial", event.target.value)}
                      />
                      <input
                        className="input-control"
                        placeholder="Observaciones"
                        value={unit.observaciones}
                        onChange={(event) => updateUnit(index, "observaciones", event.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}

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
              <div className="grid gap-2 sm:grid-cols-2">
                {isEditing && (
                  <Button type="button" variant="outline" onClick={cancelEdit} disabled={isSaving}>
                    <X className="h-4 w-4" />
                    Cancelar
                  </Button>
                )}
                <Button className={isEditing ? "" : "sm:col-span-2"} type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isEditing ? (
                    <Save className="h-4 w-4" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  {isEditing ? "Guardar cambios" : "Registrar equipo"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function getQrPayload(qrToken: string) {
  return `SILAB-FCI:EQUIPO:${qrToken}`;
}

function getShortQrToken(qrToken: string) {
  if (qrToken.length <= 14) {
    return qrToken;
  }
  return `${qrToken.slice(0, 10)}...`;
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

function syncUnitRows(form: EquipmentFormState) {
  if (!form.requiereSerial) {
    return { ...form, unidades: [] };
  }

  const count = Math.max(1, Number(form.cantidadTotal || 1));
  const unidades = [...form.unidades];

  while (unidades.length < count) {
    unidades.push({ codigoInterno: "", serial: "", observaciones: "" });
  }

  return {
    ...form,
    unidades: unidades.slice(0, count)
  };
}

function getStateBadgeClass(state: Equipment["estado"]) {
  if (state === "DISPONIBLE") {
    return "badge badge-green";
  }
  if (state === "PRESTADO" || state === "EN_MANTENIMIENTO") {
    return "badge badge-amber";
  }
  if (state === "DANADO" || state === "BAJA" || state === "PERDIDO") {
    return "badge badge-red";
  }
  return "badge badge-gray";
}

