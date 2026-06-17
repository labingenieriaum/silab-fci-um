import { FormEvent, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Barcode,
  Boxes,
  CheckCircle2,
  Download,
  Loader2,
  Pencil,
  Plus,
  QrCode,
  Save,
  Search,
  Trash2,
  Upload,
  Wrench,
  X,
  XCircle
} from "lucide-react";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import { LocationCombobox } from "@/components/location-combobox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { apiRequest } from "@/lib/api";
import { formatEnum } from "@/lib/format";
import { formatLocationPathById } from "@/lib/location-path";
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
  const [formOpen, setFormOpen] = useState(false);
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
      setFormOpen(false);
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
      setFormOpen(false);
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
        setFormOpen(false);
      }
      setFeedback("Equipo eliminado correctamente.");
      await queryClient.invalidateQueries({ queryKey: ["equipment"] });
      await queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
    },
    onError: (error) =>
      setFeedback(error instanceof Error ? error.message : "No fue posible eliminar el equipo.")
  });

  const bulkCreateMutation = useMutation({
    mutationFn: (rows: Array<Record<string, unknown>>) =>
      apiRequest<{ total: number; created: number; errors: number }>("/equipment/bulk", {
        method: "POST",
        body: JSON.stringify({ rows })
      }),
    onSuccess: async (result) => {
      setFeedback(
        `Carga CSV finalizada: ${result.created} equipos creados, ${result.errors} errores de ${result.total} filas.`
      );
      await queryClient.invalidateQueries({ queryKey: ["equipment"] });
      await queryClient.invalidateQueries({ queryKey: ["inventory-movements"] });
    },
    onError: (error) =>
      setFeedback(error instanceof Error ? error.message : "No fue posible cargar el CSV.")
  });

  const equipment = useMemo(() => equipmentQuery.data?.data ?? [], [equipmentQuery.data]);
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const locations = useMemo(() => locationsQuery.data?.data ?? [], [locationsQuery.data]);
  const categoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: String(category.id),
        label: category.nombre,
        description: category.descripcion ?? undefined,
        searchText: `${category.nombre} ${category.descripcion ?? ""}`
      })),
    [categories]
  );
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
    setFormOpen(true);
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
    setFormOpen(false);
  }

  function beginCreate() {
    setFeedback(null);
    setEditingEquipment(null);
    setForm(initialForm);
    setFormOpen(true);
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

  function downloadCsvTemplate() {
    const header = [
      "categoriaId",
      "categoriaNombre",
      "ubicacionId",
      "codigoInterno",
      "codigoBarras",
      "nombre",
      "marca",
      "modelo",
      "requiereSerial",
      "cantidadTotal",
      "valorEstimado",
      "observaciones"
    ];
    const categoryRows = categories.map((category) => [
      category.id,
      category.nombre,
      "",
      "",
      "",
      "",
      "",
      "",
      "false",
      "1",
      "0",
      "Fila de referencia: usa este categoriaId para crear equipos"
    ]);
    downloadCsvFile("formato-equipos.csv", [header, ...categoryRows]);
  }

  async function handleCsvUpload(file: File | null) {
    if (!file) return;
    setFeedback(null);
    try {
      const text = await file.text();
      const rows = parseCsv(text)
        .map((row) => ({
          categoriaId: Number(row.categoriaId),
          ubicacionId: Number(row.ubicacionId),
          codigoInterno: row.codigoInterno?.trim(),
          codigoBarras: row.codigoBarras?.trim() || undefined,
          nombre: row.nombre?.trim(),
          marca: row.marca?.trim() || undefined,
          modelo: row.modelo?.trim() || undefined,
          requiereSerial: parseCsvBoolean(row.requiereSerial),
          cantidadTotal: Number(row.cantidadTotal || 1),
          valorEstimado: Number(row.valorEstimado || 0),
          observaciones: row.observaciones?.trim() || undefined
        }))
        .filter((row) => row.codigoInterno && row.nombre && row.categoriaId && row.ubicacionId);

      if (!rows.length) {
        setFeedback("El CSV no tiene filas validas. Revisa categoriaId, ubicacionId, codigoInterno y nombre.");
        return;
      }

      bulkCreateMutation.mutate(rows);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible leer el CSV.");
    }
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
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={downloadCsvTemplate}>
            <Download className="h-4 w-4" />
            Descargar formato
          </Button>
          <Button type="button" variant="outline" asChild disabled={bulkCreateMutation.isPending}>
            <label className="cursor-pointer">
              {bulkCreateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Subir CSV
              <input
                className="hidden"
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  void handleCsvUpload(event.target.files?.[0] ?? null);
                  event.currentTarget.value = "";
                }}
              />
            </label>
          </Button>
          <Button type="button" onClick={beginCreate}>
            <Plus className="h-4 w-4" />
            Nuevo equipo
          </Button>
          <div className="flex h-10 items-center gap-2 rounded-md border bg-card px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              className="h-full w-64 bg-transparent text-sm outline-none"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por equipo, barras o QR"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Items totales" value={summary.total} icon={<Boxes className="h-4 w-4" />} />
        <Metric label="Disponibles" value={summary.disponible} icon={<CheckCircle2 className="h-4 w-4" />} />
        <Metric label="Prestados" value={summary.prestado} icon={<XCircle className="h-4 w-4" />} />
        <Metric label="Mantenimiento" value={summary.mantenimiento} icon={<Wrench className="h-4 w-4" />} />
      </section>

      <section>
        {formOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 px-4 py-8">
        <Card className="w-full max-w-4xl shadow-xl">
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
                    <tr key={item.id} className="border-t bg-card">
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
                        <div>
                          {formatLocationPathById(
                            item.ubicacionId,
                            locations,
                            `${item.ubicacion.laboratorio.codigo} / ${item.ubicacion.nombre}`
                          )}
                        </div>
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
                            aria-label="Descargar tarjeta QR y barras"
                            title="Descargar tarjeta QR y barras"
                            onClick={() => downloadEquipmentLabel(item)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
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
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2">
                {isEditing ? (
                  <Pencil className="h-4 w-4 text-primary" />
                ) : (
                  <Plus className="h-4 w-4 text-primary" />
                )}
                {isEditing ? "Editar equipo" : "Registrar equipo"}
              </CardTitle>
              <Button type="button" variant="ghost" size="icon" onClick={cancelEdit} aria-label="Cerrar">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Categoria">
                  <SearchableSelect
                    options={categoryOptions}
                    value={form.categoriaId}
                    onChange={(value) => updateForm("categoriaId", value)}
                    placeholder="Seleccionar categoria"
                    searchPlaceholder="Buscar por nombre o descripcion"
                    emptyLabel="Seleccionar"
                    required
                  />
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
                  <code className="mt-2 block break-all rounded-md bg-background px-2 py-1">
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
                <label className="flex h-10 items-center gap-2 rounded-md border bg-card px-3 text-sm font-medium">
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
          </div>
        )}
      </section>
    </div>
  );
}

function getQrPayload(qrToken: string) {
  return `SILAB-FCI:EQUIPO:${qrToken}`;
}

async function downloadEquipmentLabel(equipment: Equipment) {
  const dataUrl = await createEquipmentLabelDataUrl(equipment);
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `tarjeta-${safeFilePart(equipment.codigoInterno)}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function createEquipmentLabelDataUrl(equipment: Equipment) {
  const dpi = 300;
  const pxPerCm = dpi / 2.54;
  const width = Math.round(4 * pxPerCm);
  const height = Math.round(5.5 * pxPerCm);
  const qrSize = Math.round(3 * pxPerCm);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No fue posible crear la tarjeta.");
  }

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, width - 3, height - 3);

  drawCenteredText(ctx, equipment.nombre, width / 2, 34, {
    maxWidth: width - 34,
    size: 22,
    weight: 700
  });

  const qrDataUrl = await QRCode.toDataURL(getQrPayload(equipment.qrToken), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: qrSize,
    color: {
      dark: "#111827",
      light: "#ffffff"
    }
  });
  const qrImage = await loadImage(qrDataUrl);
  const qrX = Math.round((width - qrSize) / 2);
  ctx.drawImage(qrImage, qrX, 58, qrSize, qrSize);

  drawCenteredText(ctx, equipment.codigoInterno, width / 2, 435, {
    maxWidth: width - 34,
    size: 20,
    weight: 700
  });
  drawCenteredText(ctx, equipment.qrToken, width / 2, 465, {
    maxWidth: width - 34,
    size: 14,
    weight: 500
  });

  const barcodeValue = equipment.codigoBarras || equipment.codigoInterno;
  const barcodeSvg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  JsBarcode(barcodeSvg, barcodeValue, {
    format: "CODE128",
    width: 2,
    height: 48,
    margin: 0,
    displayValue: false
  });
  const barcodeDataUrl = svgToDataUrl(barcodeSvg);
  const barcodeImage = await loadImage(barcodeDataUrl);
  const barcodeWidth = width - 64;
  const barcodeHeight = 58;
  ctx.drawImage(barcodeImage, 32, 498, barcodeWidth, barcodeHeight);
  drawCenteredText(ctx, barcodeValue, width / 2, 582, {
    maxWidth: width - 34,
    size: 15,
    weight: 600
  });

  return canvas.toDataURL("image/png");
}

function drawCenteredText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: { maxWidth: number; size: number; weight: number }
) {
  ctx.fillStyle = "#111827";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${options.weight} ${options.size}px Inter, Arial, sans-serif`;
  let output = text.trim();
  while (ctx.measureText(output).width > options.maxWidth && output.length > 4) {
    output = `${output.slice(0, -4)}...`;
  }
  ctx.fillText(output, x, y);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No fue posible cargar la imagen generada."));
    image.src = src;
  });
}

function svgToDataUrl(svg: SVGElement) {
  const serialized = new XMLSerializer().serializeToString(svg);
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;
}

function safeFilePart(value: string) {
  return value.trim().replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "") || "equipo";
}

function getShortQrToken(qrToken: string) {
  if (qrToken.length <= 14) {
    return qrToken;
  }
  return `${qrToken.slice(0, 10)}...`;
}

function parseCsv(text: string) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim().length > 0);
  const [headerLine, ...dataLines] = lines;
  if (!headerLine) return [];
  const headers = parseCsvLine(headerLine).map((header) => header.trim());
  return dataLines.map((line) => {
    const values = parseCsvLine(line);
    return headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = values[index]?.trim() ?? "";
      return acc;
    }, {});
  });
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === "\"" && quoted && next === "\"") {
      current += "\"";
      index += 1;
      continue;
    }
    if (char === "\"") {
      quoted = !quoted;
      continue;
    }
    if (char === "," && !quoted) {
      values.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  values.push(current);
  return values;
}

function parseCsvBoolean(value?: string) {
  return ["1", "si", "sí", "true", "x"].includes((value ?? "").trim().toLowerCase());
}

function downloadCsvFile(filename: string, rows: Array<Array<string | number>>) {
  const content = rows
    .map((row) =>
      row
        .map((value) => {
          const text = String(value ?? "");
          return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
        })
        .join(",")
    )
    .join("\r\n");
  const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
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

