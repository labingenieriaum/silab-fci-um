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
import { QrScanButton } from "@/components/qr-scan-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { apiRequest } from "@/lib/api";
import { formatEnum } from "@/lib/format";
import { formatLocationPathById } from "@/lib/location-path";
import type {
  Agreement,
  Equipment,
  EquipmentCategory,
  Laboratory,
  Location,
  EquipmentUnit,
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
  permitePrestamo: boolean;
  origen: "PROPIO" | "CONVENIO";
  convenioId: string;
  convenioEntidad: string;
  convenioIdentificacion: string;
  convenioCorreo: string;
  convenioTelefono: string;
  convenioResponsable: string;
  convenioDocumentoNombre: string;
  convenioDocumentoMimeType: string;
  convenioDocumentoBase64: string;
  cantidadTotal: string;
  valorEstimado: string;
  observaciones: string;
  unidades: UnitFormState[];
}

interface UnitEditorState {
  id?: number;
  codigoInterno: string;
  serial: string;
  ubicacionId: string;
  observaciones: string;
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
  permitePrestamo: false,
  origen: "PROPIO",
  convenioId: "",
  convenioEntidad: "",
  convenioIdentificacion: "",
  convenioCorreo: "",
  convenioTelefono: "",
  convenioResponsable: "",
  convenioDocumentoNombre: "",
  convenioDocumentoMimeType: "",
  convenioDocumentoBase64: "",
  cantidadTotal: "1",
  valorEstimado: "0",
  observaciones: "",
  unidades: []
};

const initialUnitEditor: UnitEditorState = {
  codigoInterno: "",
  serial: "",
  ubicacionId: "",
  observaciones: ""
};

export function EquipmentPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<EquipmentFormState>(initialForm);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [unitEquipment, setUnitEquipment] = useState<Equipment | null>(null);
  const [unitEditor, setUnitEditor] = useState<UnitEditorState>(initialUnitEditor);
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
    queryFn: () => apiRequest<PaginatedResponse<Location>>("/locations?page=1&pageSize=1000")
  });

  const laboratoriesQuery = useQuery({
    queryKey: ["laboratories"],
    queryFn: () => apiRequest<PaginatedResponse<Laboratory>>("/laboratories?page=1&pageSize=100")
  });

  const agreementsQuery = useQuery({
    queryKey: ["agreements", "active"],
    queryFn: () => apiRequest<PaginatedResponse<Agreement>>("/agreements?page=1&pageSize=200&activo=true")
  });

  const unitsQuery = useQuery({
    queryKey: ["equipment-units", unitEquipment?.id],
    enabled: Boolean(unitEquipment?.id),
    queryFn: () => apiRequest<EquipmentUnit[]>(`/equipment/${unitEquipment?.id}/units`)
  });

  const createMutation = useMutation({
    mutationFn: async (payload: EquipmentFormState) => {
      const ubicacionId = await resolveLocationSelection(payload.ubicacionId);
      return apiRequest<Equipment>("/equipment", {
        method: "POST",
        body: JSON.stringify({
          categoriaId: Number(payload.categoriaId),
          ubicacionId,
          convenioId: payload.origen === "CONVENIO" ? Number(payload.convenioId) : null,
          codigoInterno: payload.codigoInterno,
          codigoBarras: payload.codigoBarras || undefined,
          nombre: payload.nombre,
          marca: payload.marca || undefined,
          modelo: payload.modelo || undefined,
          requiereSerial: payload.requiereSerial,
          permitePrestamo: payload.permitePrestamo,
          origen: payload.origen,
          convenioEntidad: payload.origen === "CONVENIO" ? payload.convenioEntidad || null : null,
          convenioIdentificacion:
            payload.origen === "CONVENIO" ? payload.convenioIdentificacion || null : null,
          convenioCorreo: payload.origen === "CONVENIO" ? payload.convenioCorreo || null : null,
          convenioTelefono: payload.origen === "CONVENIO" ? payload.convenioTelefono || null : null,
          convenioResponsable: payload.origen === "CONVENIO" ? payload.convenioResponsable || null : null,
          convenioDocumentoNombre:
            payload.origen === "CONVENIO" ? payload.convenioDocumentoNombre || null : null,
          convenioDocumentoMimeType:
            payload.origen === "CONVENIO" ? payload.convenioDocumentoMimeType || null : null,
          convenioDocumentoBase64:
            payload.origen === "CONVENIO" ? payload.convenioDocumentoBase64 || null : null,
          cantidadTotal: Number(payload.cantidadTotal),
          valorEstimado: Number(payload.valorEstimado || 0),
          observaciones: payload.observaciones || undefined,
          unidades: payload.requiereSerial
            ? payload.unidades.map((unit) => ({
                codigoInterno: unit.codigoInterno,
                serial: undefined,
                ubicacionId,
                observaciones: unit.observaciones || undefined
              }))
            : undefined
        })
      });
    },
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
    mutationFn: async ({ id, payload }: { id: number; payload: EquipmentFormState }) => {
      const ubicacionId = await resolveLocationSelection(payload.ubicacionId);
      return apiRequest<Equipment>(`/equipment/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          categoriaId: Number(payload.categoriaId),
          ubicacionId,
          convenioId: payload.origen === "CONVENIO" ? Number(payload.convenioId) : null,
          codigoInterno: payload.codigoInterno,
          codigoBarras: payload.codigoBarras,
          nombre: payload.nombre,
          marca: payload.marca,
          modelo: payload.modelo,
          permitePrestamo: payload.permitePrestamo,
          origen: payload.origen,
          convenioEntidad: payload.origen === "CONVENIO" ? payload.convenioEntidad || null : null,
          convenioIdentificacion:
            payload.origen === "CONVENIO" ? payload.convenioIdentificacion || null : null,
          convenioCorreo: payload.origen === "CONVENIO" ? payload.convenioCorreo || null : null,
          convenioTelefono: payload.origen === "CONVENIO" ? payload.convenioTelefono || null : null,
          convenioResponsable: payload.origen === "CONVENIO" ? payload.convenioResponsable || null : null,
          convenioDocumentoNombre:
            payload.origen === "CONVENIO" ? payload.convenioDocumentoNombre || null : null,
          convenioDocumentoMimeType:
            payload.origen === "CONVENIO" ? payload.convenioDocumentoMimeType || null : null,
          convenioDocumentoBase64:
            payload.origen === "CONVENIO" ? payload.convenioDocumentoBase64 || null : null,
          valorEstimado: Number(payload.valorEstimado || 0),
          observaciones: payload.observaciones
        })
      });
    },
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

  const saveUnitMutation = useMutation({
    mutationFn: async (payload: UnitEditorState) => {
      if (!unitEquipment) {
        throw new Error("Selecciona un equipo.");
      }
      const body = JSON.stringify({
        codigoInterno: payload.codigoInterno,
        serial: payload.serial || null,
        ubicacionId: payload.ubicacionId ? Number(payload.ubicacionId) : undefined,
        observaciones: payload.observaciones || null
      });
      if (payload.id) {
        return apiRequest<EquipmentUnit>(`/equipment-units/${payload.id}`, {
          method: "PATCH",
          body
        });
      }
      return apiRequest<EquipmentUnit>(`/equipment/${unitEquipment.id}/units`, {
        method: "POST",
        body
      });
    },
    onSuccess: async () => {
      setFeedback("Unidad actualizada correctamente.");
      setUnitEditor(initialUnitEditor);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["equipment"] }),
        queryClient.invalidateQueries({ queryKey: ["equipment-units"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory-movements"] })
      ]);
    },
    onError: (error) =>
      setFeedback(error instanceof Error ? error.message : "No fue posible guardar la unidad.")
  });

  const removeUnitMutation = useMutation({
    mutationFn: (id: number) => apiRequest<EquipmentUnit>(`/equipment-units/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      setFeedback("Unidad dada de baja correctamente.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["equipment"] }),
        queryClient.invalidateQueries({ queryKey: ["equipment-units"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory-movements"] })
      ]);
    },
    onError: (error) =>
      setFeedback(error instanceof Error ? error.message : "No fue posible dar de baja la unidad.")
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
  const laboratories = useMemo(() => laboratoriesQuery.data?.data ?? [], [laboratoriesQuery.data]);
  const agreements = useMemo(() => agreementsQuery.data?.data ?? [], [agreementsQuery.data]);
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
  const agreementOptions = useMemo(
    () =>
      agreements.map((agreement) => ({
        value: String(agreement.id),
        label: agreement.nombre,
        description: [agreement.identificacion, agreement.correo, agreement.telefono].filter(Boolean).join(" | "),
        searchText: `${agreement.nombre} ${agreement.identificacion ?? ""} ${agreement.correo ?? ""} ${agreement.telefono ?? ""}`
      })),
    [agreements]
  );
  const isEditing = editingEquipment !== null;
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const managedUnits = useMemo(() => unitsQuery.data ?? [], [unitsQuery.data]);

  const summary = useMemo(
    () =>
      equipment.reduce(
        (acc, item) => {
          acc.total += item.cantidadTotal;
          acc.disponible += item.permitePrestamo ? item.cantidadDisponible : 0;
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
      if (key === "origen" && value === "PROPIO") {
        next.convenioId = "";
        next.convenioEntidad = "";
        next.convenioIdentificacion = "";
        next.convenioCorreo = "";
        next.convenioTelefono = "";
        next.convenioResponsable = "";
        next.convenioDocumentoNombre = "";
        next.convenioDocumentoMimeType = "";
        next.convenioDocumentoBase64 = "";
      }
      if (key === "cantidadTotal" || key === "requiereSerial") {
        return syncUnitRows(next);
      }
      return next;
    });
  }

  async function handleAgreementFile(file: File | null) {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setFeedback("El documento del convenio debe ser PDF.");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setForm((current) => ({
      ...current,
      convenioDocumentoNombre: file.name,
      convenioDocumentoMimeType: file.type,
      convenioDocumentoBase64: dataUrl
    }));
  }

  function updateUnit(index: number, key: keyof UnitFormState, value: string) {
    setForm((current) => ({
      ...current,
      unidades: current.unidades.map((unit, unitIndex) =>
        unitIndex === index ? { ...unit, [key]: value } : unit
      )
    }));
  }

  function updateUnitEditor<K extends keyof UnitEditorState>(key: K, value: UnitEditorState[K]) {
    setUnitEditor((current) => ({ ...current, [key]: value }));
  }

  function openUnitManager(item: Equipment) {
    setUnitEquipment(item);
    setUnitEditor(initialUnitEditor);
  }

  function editUnit(unit: EquipmentUnit) {
    setUnitEditor({
      id: unit.id,
      codigoInterno: unit.codigoInterno,
      serial: unit.serial ?? "",
      ubicacionId: unit.ubicacionId ? String(unit.ubicacionId) : "",
      observaciones: unit.observaciones ?? ""
    });
  }

  function handleUnitSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    if (!unitEditor.codigoInterno.trim()) {
      setFeedback("Ingresa el codigo de la etiqueta.");
      return;
    }
    saveUnitMutation.mutate(unitEditor);
  }

  function beginEdit(item: Equipment) {
    setFeedback(null);
    setEditingEquipment(item);
    setFormOpen(true);
    setForm({
      categoriaId: String(item.categoriaId),
      ubicacionId: String(item.ubicacionId),
      convenioId: item.convenioId ? String(item.convenioId) : "",
      codigoInterno: item.codigoInterno,
      codigoBarras: item.codigoBarras ?? "",
      nombre: item.nombre,
      marca: item.marca ?? "",
      modelo: item.modelo ?? "",
      requiereSerial: item.requiereSerial,
      permitePrestamo: item.permitePrestamo,
      origen: item.origen,
      convenioEntidad: item.convenioEntidad ?? "",
      convenioIdentificacion: item.convenioIdentificacion ?? "",
      convenioCorreo: item.convenioCorreo ?? "",
      convenioTelefono: item.convenioTelefono ?? "",
      convenioResponsable: item.convenioResponsable ?? "",
      convenioDocumentoNombre: item.convenioDocumentoNombre ?? "",
      convenioDocumentoMimeType: item.convenioDocumentoMimeType ?? "",
      convenioDocumentoBase64: item.convenioDocumentoBase64 ?? "",
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
    if (form.origen === "CONVENIO" && !form.convenioId) {
      setFeedback("Selecciona el convenio asociado al equipo.");
      return;
    }
    if (!isEditing && form.requiereSerial && form.unidades.some((unit) => !unit.codigoInterno.trim())) {
      setFeedback("Cada unidad individual requiere el codigo unico de la etiqueta institucional.");
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
      "tipoFila",
      "categoriaId",
      "categoriaNombre",
      "ubicacionId",
      "ubicacionRuta",
      "codigoInterno",
      "codigoBarras",
      "nombre",
      "marca",
      "modelo",
      "requiereSerial",
      "permitePrestamo",
      "origen",
      "convenioId",
      "convenioNombreReferencia",
      "convenioNombre",
      "convenioCedulaNit",
      "convenioCorreo",
      "convenioTelefono",
      "convenioResponsable",
      "cantidadTotal",
      "valorEstimado",
      "observaciones",
      "unidadCodigo",
      "unidadUbicacionId",
      "unidadObservaciones"
    ];
    const categoryRows = categories.map((category) => [
      "REFERENCIA_CATEGORIA",
      category.id,
      category.nombre,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "false",
      "false",
      "PROPIO",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "1",
      "0",
      "Fila de referencia: usa este categoriaId para crear equipos",
      "",
      "",
      ""
    ]);
    const locationRows = locations.map((location) => [
      "REFERENCIA_UBICACION",
      "",
      "",
      location.id,
      formatLocationPathById(location.id, locations),
      "",
      "",
      "",
      "",
      "",
      "false",
      "false",
      "PROPIO",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "1",
      "0",
      `Fila de referencia: ubicacionId ${location.id} - ${formatLocationPathById(location.id, locations)}`,
      "",
      "",
      ""
    ]);
    const exampleLocationId = locations[0]?.id ?? "";
    const agreementRows = agreements.map((agreement) => [
      "REFERENCIA_CONVENIO",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "false",
      "false",
      "CONVENIO",
      agreement.id,
      agreement.nombre,
      "",
      "",
      "",
      "",
      "",
      "1",
      "0",
      `Fila de referencia: convenioId ${agreement.id} - ${agreement.nombre}`,
      "",
      "",
      ""
    ]);
    const exampleRows = [
      [
        "EJEMPLO",
        categories[0]?.id ?? 1,
        categories[0]?.nombre ?? "Activo Fijo",
        exampleLocationId,
        exampleLocationId ? formatLocationPathById(Number(exampleLocationId), locations) : "",
        "PANT-HP-C204",
        "",
        "Pantalla HP",
        "HP",
        "Modelo X",
        "true",
        "false",
        "PROPIO",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "14",
        "0",
        "Pantallas del C204 agrupadas como un solo equipo",
        "2805006622",
        exampleLocationId,
        "Pantalla 1"
      ],
      [
        "EJEMPLO",
        categories[0]?.id ?? 1,
        categories[0]?.nombre ?? "Activo Fijo",
        exampleLocationId,
        exampleLocationId ? formatLocationPathById(Number(exampleLocationId), locations) : "",
        "PANT-HP-C204",
        "",
        "Pantalla HP",
        "HP",
        "Modelo X",
        "true",
        "false",
        "PROPIO",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "14",
        "0",
        "Pantallas del C204 agrupadas como un solo equipo",
        "2805006623",
        exampleLocationId,
        "Pantalla 2"
      ]
    ];
    downloadCsvFile("formato-equipos.csv", [header, ...categoryRows, ...locationRows, ...agreementRows, ...exampleRows]);
  }

  function buildBulkEquipmentRows(csvRows: Array<Record<string, string>>) {
    const grouped = new Map<string, Record<string, unknown> & { unidades?: Array<Record<string, unknown>> }>();

    for (const row of csvRows) {
      const tipoFila = normalizeCsvToken(row.tipoFila);
      if (tipoFila.startsWith("referencia") || tipoFila.startsWith("ejemplo")) {
        continue;
      }
      const codigoInterno = row.codigoInterno?.trim();
      const nombre = row.nombre?.trim();
      const categoriaId = Number(row.categoriaId);
      const ubicacionId = Number(row.ubicacionId);
      if (!codigoInterno || !nombre || !categoriaId || !ubicacionId) {
        continue;
      }

      const key = codigoInterno.toUpperCase();
      const unidadCodigo = row.unidadCodigo?.trim();
      const current =
        grouped.get(key) ??
        {
          categoriaId,
          ubicacionId,
          codigoInterno,
          codigoBarras: row.codigoBarras?.trim() || undefined,
          nombre,
          marca: row.marca?.trim() || undefined,
          modelo: row.modelo?.trim() || undefined,
          requiereSerial: parseCsvBoolean(row.requiereSerial) || Boolean(unidadCodigo),
          permitePrestamo: parseCsvBoolean(row.permitePrestamo),
          origen: normalizeCsvToken(row.origen) === "convenio" ? "CONVENIO" : "PROPIO",
          convenioId: row.convenioId ? Number(row.convenioId) : undefined,
          convenioEntidad: (row.convenioNombre || row.convenioEntidad)?.trim() || undefined,
          convenioIdentificacion: (row.convenioCedulaNit || row.convenioIdentificacion)?.trim() || undefined,
          convenioCorreo: row.convenioCorreo?.trim() || undefined,
          convenioTelefono: row.convenioTelefono?.trim() || undefined,
          convenioResponsable: row.convenioResponsable?.trim() || undefined,
          cantidadTotal: Number(row.cantidadTotal || 1),
          valorEstimado: Number(row.valorEstimado || 0),
          observaciones: row.observaciones?.trim() || undefined,
          unidades: []
        };

      if (unidadCodigo) {
        current.requiereSerial = true;
        current.unidades = [
          ...(current.unidades ?? []),
          {
            codigoInterno: unidadCodigo,
            ubicacionId: row.unidadUbicacionId ? Number(row.unidadUbicacionId) : ubicacionId,
            observaciones: row.unidadObservaciones?.trim() || undefined
          }
        ];
        current.cantidadTotal = current.unidades.length;
      }

      grouped.set(key, current);
    }

    return Array.from(grouped.values()).map((row) => ({
      ...row,
      unidades: row.unidades?.length ? row.unidades : undefined
    }));
  }

  async function handleCsvUpload(file: File | null) {
    if (!file) return;
    setFeedback(null);
    try {
      const text = await file.text();
      const rows = buildBulkEquipmentRows(parseCsv(text));

      if (!rows.length) {
        setFeedback("El CSV no tiene filas validas. Revisa categoriaId, ubicacionId, codigoInterno y nombre.");
        return;
      }

      bulkCreateMutation.mutate(rows);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible leer el CSV.");
    }
  }

  async function resolveLocationSelection(selection: string) {
    if (selection.startsWith("lab:")) {
      const laboratoryId = Number(selection.replace("lab:", ""));
      const rootLocation = await apiRequest<Location>(`/locations/laboratories/${laboratoryId}/root`, {
        method: "POST"
      });
      await queryClient.invalidateQueries({ queryKey: ["locations"] });
      return rootLocation.id;
    }
    return Number(selection);
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Equipos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registro de equipos, cantidades, identificadores institucionales y ubicacion responsable.
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
            <QrScanButton onScan={setSearch} />
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
                    <tr key={item.id} className="border-t bg-card">
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.nombre}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.codigoInterno}
                          {item.requiereSerial ? ` - ${item._count.unidades} unidades identificadas` : ""}
                        </div>
                        <div className="mt-1">
                          <div className="flex flex-wrap gap-1">
                            <span
                              className={`inline-flex rounded-md px-2 py-1 text-xs font-medium ${
                                item.permitePrestamo
                                  ? "bg-green-50 text-green-700"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {item.permitePrestamo ? "Disponible para prestamos" : "Solo inventario fijo"}
                            </span>
                            {item.origen === "CONVENIO" && (
                              <span className="inline-flex rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                                Convenio: {item.convenio?.nombre ?? item.convenioEntidad ?? "Sin convenio"}
                              </span>
                            )}
                          </div>
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
                        {item.requiereSerial ? (
                          <>
                            <div>Por etiqueta individual</div>
                            <div className="text-xs text-muted-foreground">
                              Abre unidades para ver la ubicacion real de cada activo fisico.
                            </div>
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">{item.cantidadTotal}</td>
                      <td className="px-4 py-3 text-right">
                        {item.permitePrestamo ? item.cantidadDisponible : 0}
                        {!item.permitePrestamo && (
                          <div className="text-xs font-normal text-muted-foreground">No prestable</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">{item.cantidadPrestada}</td>
                      <td className="px-4 py-3 text-right">{item.cantidadMantenimiento}</td>
                      <td className="px-4 py-3">
                        <span className={getStateBadgeClass(item.estado)}>{formatEnum(item.estado)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          {item.requiereSerial && (
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Gestionar unidades etiquetadas"
                              title="Gestionar unidades etiquetadas"
                              onClick={() => openUnitManager(item)}
                            >
                              <Boxes className="h-4 w-4" />
                            </Button>
                          )}
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

        {formOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 px-4 py-8">
        <Card className="w-full max-w-4xl shadow-xl">
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
                    laboratories={laboratories}
                    value={form.ubicacionId}
                    onChange={(value) => updateForm("ubicacionId", value)}
                    placeholder="Seleccionar"
                    emptyLabel="Seleccionar"
                    allowLaboratorySelection
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
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex min-h-10 items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={form.permitePrestamo}
                      onChange={(event) => updateForm("permitePrestamo", event.target.checked)}
                    />
                    Disponible para prestamos
                  </label>
                  <label className="flex min-h-10 items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={form.requiereSerial}
                      disabled={isEditing}
                      onChange={(event) => updateForm("requiereSerial", event.target.checked)}
                    />
                    Control individual por etiqueta
                  </label>
                  <p className="sm:col-span-2 text-xs text-muted-foreground">
                    Marca "Disponible para prestamos" solo si el equipo puede salir en solicitudes. Activos fijos de laboratorio, como pantallas de aula, pueden quedar como inventario fijo.
                  </p>
                </div>
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
                  <div>
                    <p className="text-sm font-medium">Codigos unicos de unidades</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Registra el codigo de la etiqueta institucional de cada unidad. Ejemplo: 2805006622.
                    </p>
                  </div>
                  {form.unidades.map((unit, index) => (
                    <div key={index} className="grid gap-2 sm:grid-cols-[220px_minmax(0,1fr)]">
                      <input
                        className="input-control"
                        placeholder={`Codigo etiqueta ${index + 1}`}
                        value={unit.codigoInterno}
                        onChange={(event) => updateUnit(index, "codigoInterno", event.target.value)}
                        required
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

              <div className="space-y-3 rounded-md border bg-muted/20 p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Origen del equipo">
                    <select
                      className="input-control"
                      value={form.origen}
                      onChange={(event) => updateForm("origen", event.target.value as EquipmentFormState["origen"])}
                    >
                      <option value="PROPIO">Propio de la facultad</option>
                      <option value="CONVENIO">Convenio / prestado a la facultad</option>
                    </select>
                  </Field>
                </div>
                {form.origen === "CONVENIO" && (
                  <div className="grid gap-3">
                    <Field label="Convenio asociado">
                      <SearchableSelect
                        options={agreementOptions}
                        value={form.convenioId}
                        onChange={(value) => updateForm("convenioId", value)}
                        placeholder="Seleccionar convenio"
                        searchPlaceholder="Buscar por nombre, cedula, NIT o correo"
                        emptyLabel="Sin convenios activos"
                        required
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        Si no aparece, primero registralo en el menu Convenios.
                      </p>
                    </Field>
                  </div>
                )}
              </div>

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

      {unitEquipment && (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-black/45 p-4">
          <div className="mx-auto my-8 max-w-5xl rounded-lg border bg-background shadow-xl">
            <div className="flex items-start justify-between border-b px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">Unidades etiquetadas</h2>
                <p className="text-sm text-muted-foreground">
                  {unitEquipment.codigoInterno} - {unitEquipment.nombre}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setUnitEquipment(null);
                  setUnitEditor(initialUnitEditor);
                }}
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="overflow-x-auto rounded-md border">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Etiqueta</th>
                      <th className="px-4 py-3 text-left font-semibold">Estado</th>
                      <th className="px-4 py-3 text-left font-semibold">Ubicacion</th>
                      <th className="px-4 py-3 text-left font-semibold">Observaciones</th>
                      <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managedUnits.map((unit) => (
                      <tr key={unit.id} className="border-t bg-card">
                        <td className="px-4 py-3">
                          <div className="font-medium">{unit.codigoInterno}</div>
                          {unit.serial && <div className="text-xs text-muted-foreground">Serial: {unit.serial}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className={getStateBadgeClass(unit.estado)}>{formatEnum(unit.estado)}</span>
                        </td>
                        <td className="px-4 py-3">
                          {unit.ubicacion
                            ? formatLocationPathById(unit.ubicacionId, locations, unit.ubicacion.nombre)
                            : "Sin ubicacion"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{unit.observaciones || "Sin observaciones"}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              title="Editar unidad"
                              aria-label="Editar unidad"
                              onClick={() => editUnit(unit)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              title="Dar de baja unidad"
                              aria-label="Dar de baja unidad"
                              disabled={unit.estado === "PRESTADO" || unit.estado === "EN_MANTENIMIENTO"}
                              onClick={() => {
                                if (window.confirm(`Dar de baja la unidad ${unit.codigoInterno}?`)) {
                                  removeUnitMutation.mutate(unit.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!managedUnits.length && (
                      <tr>
                        <td className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>
                          No hay unidades registradas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <form className="space-y-3 rounded-md border bg-card p-4" onSubmit={handleUnitSubmit}>
                <div>
                  <h3 className="font-semibold">{unitEditor.id ? "Editar unidad" : "Nueva unidad"}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Usa el codigo de la etiqueta institucional pegada al equipo.
                  </p>
                </div>
                <Field label="Codigo etiqueta">
                  <input
                    className="input-control"
                    value={unitEditor.codigoInterno}
                    onChange={(event) => updateUnitEditor("codigoInterno", event.target.value)}
                    required
                  />
                </Field>
                <Field label="Serial opcional">
                  <input
                    className="input-control"
                    value={unitEditor.serial}
                    onChange={(event) => updateUnitEditor("serial", event.target.value)}
                  />
                </Field>
                <Field label="Ubicacion">
                  <LocationCombobox
                    locations={locations}
                    value={unitEditor.ubicacionId}
                    onChange={(value) => updateUnitEditor("ubicacionId", value)}
                    placeholder="Usar ubicacion del equipo"
                    emptyLabel="Usar ubicacion del equipo"
                    searchPlaceholder="Buscar ubicacion"
                  />
                </Field>
                <Field label="Observaciones">
                  <textarea
                    className="textarea-control"
                    value={unitEditor.observaciones}
                    onChange={(event) => updateUnitEditor("observaciones", event.target.value)}
                  />
                </Field>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button type="button" variant="outline" onClick={() => setUnitEditor(initialUnitEditor)}>
                    Limpiar
                  </Button>
                  <Button type="submit" disabled={saveUnitMutation.isPending}>
                    {saveUnitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Guardar
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
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
  const delimiter = detectCsvDelimiter(headerLine);
  const headers = parseCsvLine(headerLine, delimiter).map((header) => header.trim());
  return dataLines.map((line) => {
    const values = parseCsvLine(line, delimiter);
    return headers.reduce<Record<string, string>>((acc, header, index) => {
      acc[header] = values[index]?.trim() ?? "";
      return acc;
    }, {});
  });
}

function detectCsvDelimiter(line: string) {
  return line.split(";").length >= line.split(",").length ? ";" : ",";
}

function parseCsvLine(line: string, delimiter = ";") {
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
    if (char === delimiter && !quoted) {
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

function normalizeCsvToken(value?: string) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("No fue posible leer el archivo."));
    reader.readAsDataURL(file);
  });
}

function downloadCsvFile(filename: string, rows: Array<Array<string | number>>) {
  const content = rows
    .map((row) =>
      row
        .map((value) => {
          const text = String(value ?? "");
          return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
        })
        .join(";")
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

