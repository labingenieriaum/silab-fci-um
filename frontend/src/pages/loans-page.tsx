import { FormEvent, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ClipboardCheck,
  Loader2,
  PackageCheck,
  Plus,
  RotateCcw,
  Search,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { useAuth } from "@/features/auth/auth-context";
import { apiRequest } from "@/lib/api";
import { formatDateTime, formatEnum } from "@/lib/format";
import type { Equipment, EquipmentUnit, PaginatedResponse } from "@/types/inventory";
import type {
  EstadoCondicionEquipo,
  EstadoPrestamo,
  Loan,
  PaginatedLoans,
  TipoUso
} from "@/types/loans";

interface LoanFormState {
  equipoId: string;
  equipoUnidadId: string;
  cantidadSolicitada: string;
  tipoUso: TipoUso;
  fechaDevolucionEstimada: string;
  observaciones: string;
}

const initialForm: LoanFormState = {
  equipoId: "",
  equipoUnidadId: "",
  cantidadSolicitada: "1",
  tipoUso: "ACADEMICO",
  fechaDevolucionEstimada: toDatetimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000)),
  observaciones: ""
};

const returnConditions: EstadoCondicionEquipo[] = [
  "BUENO",
  "REGULAR",
  "DANADO",
  "INCOMPLETO",
  "PERDIDO"
];

export function LoansPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null);
  const [form, setForm] = useState<LoanFormState>(initialForm);
  const [rejectReason, setRejectReason] = useState("");
  const [returnQuantities, setReturnQuantities] = useState<Record<number, string>>({});
  const [returnConditionsByDetail, setReturnConditionsByDetail] = useState<
    Record<number, EstadoCondicionEquipo>
  >({});
  const [feedback, setFeedback] = useState<string | null>(null);

  const loansQuery = useQuery({
    queryKey: ["loans", search],
    queryFn: () =>
      apiRequest<PaginatedLoans>(
        `/loans?page=1&pageSize=50${search ? `&search=${encodeURIComponent(search)}` : ""}`
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

  const loans = useMemo(() => loansQuery.data?.data ?? [], [loansQuery.data]);
  const equipment = equipmentQuery.data?.data ?? [];
  const selectedLoan = loans.find((loan) => loan.id === selectedLoanId) ?? loans[0] ?? null;

  const summary = useMemo(
    () =>
      loans.reduce(
        (acc, loan) => {
          acc.total += 1;
          if (loan.estado === "SOLICITADO") acc.solicitados += 1;
          if (loan.estado === "APROBADO") acc.aprobados += 1;
          if (["ENTREGADO", "DEVUELTO_PARCIAL", "VENCIDO"].includes(loan.estado)) acc.enCurso += 1;
          return acc;
        },
        { total: 0, solicitados: 0, aprobados: 0, enCurso: 0 }
      ),
    [loans]
  );

  const createMutation = useMutation({
    mutationFn: (payload: LoanFormState) =>
      apiRequest<Loan>("/loans", {
        method: "POST",
        body: JSON.stringify({
          tipoUso: payload.tipoUso,
          fechaDevolucionEstimada: new Date(payload.fechaDevolucionEstimada).toISOString(),
          observaciones: payload.observaciones || undefined,
          detalles: [
            {
              equipoId: Number(payload.equipoId),
              equipoUnidadId: payload.equipoUnidadId ? Number(payload.equipoUnidadId) : undefined,
              cantidadSolicitada: selectedEquipment?.requiereSerial
                ? 1
                : Number(payload.cantidadSolicitada)
            }
          ]
        })
      }),
    onSuccess: async (loan) => {
      setFeedback("Solicitud registrada correctamente.");
      setSelectedLoanId(loan.id);
      setForm(initialForm);
      await queryClient.invalidateQueries({ queryKey: ["loans"] });
    },
    onError: (error) => setFeedback(error instanceof Error ? error.message : "No fue posible registrar la solicitud.")
  });

  const approveMutation = useMutation({
    mutationFn: (loanId: number) =>
      apiRequest<Loan>(`/loans/${loanId}/approve`, {
        method: "PATCH",
        body: JSON.stringify({})
      }),
    onSuccess: async (loan) => {
      setFeedback("Prestamo aprobado.");
      setSelectedLoanId(loan.id);
      await queryClient.invalidateQueries({ queryKey: ["loans"] });
    },
    onError: setErrorFeedback
  });

  const rejectMutation = useMutation({
    mutationFn: ({ loanId, reason }: { loanId: number; reason: string }) =>
      apiRequest<Loan>(`/loans/${loanId}/reject`, {
        method: "PATCH",
        body: JSON.stringify({ motivoRechazo: reason })
      }),
    onSuccess: async (loan) => {
      setFeedback("Prestamo rechazado.");
      setSelectedLoanId(loan.id);
      setRejectReason("");
      await queryClient.invalidateQueries({ queryKey: ["loans"] });
    },
    onError: setErrorFeedback
  });

  const deliverMutation = useMutation({
    mutationFn: (loanId: number) =>
      apiRequest<Loan>(`/loans/${loanId}/deliver`, {
        method: "PATCH",
        body: JSON.stringify({})
      }),
    onSuccess: async (loan) => {
      setFeedback("Entrega registrada.");
      setSelectedLoanId(loan.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["loans"] }),
        queryClient.invalidateQueries({ queryKey: ["equipment"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory-movements"] })
      ]);
    },
    onError: setErrorFeedback
  });

  const returnMutation = useMutation({
    mutationFn: (loan: Loan) =>
      apiRequest<Loan>(`/loans/${loan.id}/returns`, {
        method: "POST",
        body: JSON.stringify({
          detalles: loan.detalles
            .map((detail) => ({
              prestamoDetalleId: detail.id,
              cantidad: Number(returnQuantities[detail.id] ?? 0),
              estadoDevolucion: returnConditionsByDetail[detail.id] ?? "BUENO"
            }))
            .filter((detail) => detail.cantidad > 0)
        })
      }),
    onSuccess: async (loan) => {
      setFeedback("Devolucion registrada.");
      setSelectedLoanId(loan.id);
      setReturnQuantities({});
      setReturnConditionsByDetail({});
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["loans"] }),
        queryClient.invalidateQueries({ queryKey: ["equipment"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory-movements"] })
      ]);
    },
    onError: setErrorFeedback
  });

  function setErrorFeedback(error: unknown) {
    setFeedback(error instanceof Error ? error.message : "No fue posible completar la accion.");
  }

  function updateForm<K extends keyof LoanFormState>(key: K, value: LoanFormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "equipoId" ? { equipoUnidadId: "", cantidadSolicitada: "1" } : {})
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
      setFeedback("Selecciona una unidad disponible.");
      return;
    }
    createMutation.mutate(form);
  }

  function handleReject(loan: Loan) {
    setFeedback(null);
    if (rejectReason.trim().length < 3) {
      setFeedback("Escribe el motivo de rechazo.");
      return;
    }
    rejectMutation.mutate({ loanId: loan.id, reason: rejectReason });
  }

  function handleReturn(loan: Loan) {
    setFeedback(null);
    const hasQuantity = loan.detalles.some((detail) => Number(returnQuantities[detail.id] ?? 0) > 0);
    if (!hasQuantity) {
      setFeedback("Registra al menos una cantidad a devolver.");
      return;
    }
    returnMutation.mutate(loan);
  }

  const pendingAction =
    createMutation.isPending ||
    approveMutation.isPending ||
    rejectMutation.isPending ||
    deliverMutation.isPending ||
    returnMutation.isPending;

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Prestamos y devoluciones</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Solicitudes, aprobaciones, entregas y recepcion de equipos.
          </p>
        </div>
        <div className="flex h-10 items-center gap-2 rounded-md border bg-white px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            className="h-full w-64 bg-transparent text-sm outline-none"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar prestamo"
          />
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Prestamos" value={summary.total} icon={<ClipboardCheck className="h-4 w-4" />} />
        <Metric label="Solicitados" value={summary.solicitados} icon={<Plus className="h-4 w-4" />} />
        <Metric label="Aprobados" value={summary.aprobados} icon={<Check className="h-4 w-4" />} />
        <Metric label="En curso" value={summary.enCurso} icon={<PackageCheck className="h-4 w-4" />} />
      </section>

      <section className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_430px]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Solicitudes recientes</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {loansQuery.data?.total ?? 0} registros encontrados
              </p>
            </div>
            {loansQuery.isFetching && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[980px] text-sm">
                <thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Codigo</th>
                    <th className="px-4 py-3 text-left font-semibold">Solicitante</th>
                    <th className="px-4 py-3 text-left font-semibold">Equipo</th>
                    <th className="px-4 py-3 text-left font-semibold">Uso</th>
                    <th className="px-4 py-3 text-left font-semibold">Estado</th>
                    <th className="px-4 py-3 text-left font-semibold">Devolucion</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan) => (
                    <tr
                      key={loan.id}
                      className="cursor-pointer border-t bg-white hover:bg-muted/30"
                      onClick={() => setSelectedLoanId(loan.id)}
                    >
                      <td className="px-4 py-3 font-medium">{loan.codigo}</td>
                      <td className="px-4 py-3">
                        <div>{loan.usuarioSolicitante.nombre}</div>
                        <div className="text-xs text-muted-foreground">{loan.usuarioSolicitante.correo}</div>
                      </td>
                      <td className="px-4 py-3">
                        {loan.detalles.map((detail) => (
                          <div key={detail.id}>
                            {detail.equipo.codigoInterno} - {detail.equipo.nombre}
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-3">{formatEnum(loan.tipoUso)}</td>
                      <td className="px-4 py-3">
                        <span className={getLoanBadgeClass(loan.estado)}>{formatEnum(loan.estado)}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {formatDateTime(loan.fechaDevolucionEstimada)}
                      </td>
                    </tr>
                  ))}
                  {!loans.length && (
                    <tr>
                      <td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>
                        No hay prestamos registrados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {hasPermission("prestamos:solicitar") && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" />
                  Nueva solicitud
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleCreate}>
                  <Field label="Equipo">
                    <select
                      className="input-control"
                      value={form.equipoId}
                      onChange={(event) => updateForm("equipoId", event.target.value)}
                      required
                    >
                      <option value="">Seleccionar</option>
                      {equipment.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.codigoInterno} - {item.nombre} ({item.cantidadDisponible})
                        </option>
                      ))}
                    </select>
                  </Field>

                  {selectedEquipment?.requiereSerial ? (
                    <Field label="Unidad">
                      <select
                        className="input-control"
                        value={form.equipoUnidadId}
                        onChange={(event) => updateForm("equipoUnidadId", event.target.value)}
                        required
                      >
                        <option value="">Seleccionar</option>
                        {(unitsQuery.data ?? [])
                          .filter((unit) => unit.estado === "DISPONIBLE")
                          .map((unit) => (
                            <option key={unit.id} value={unit.id}>
                              {unit.codigoInterno}
                              {unit.serial ? ` / ${unit.serial}` : ""}
                            </option>
                          ))}
                      </select>
                    </Field>
                  ) : (
                    <Field label="Cantidad">
                      <input
                        className="input-control"
                        type="number"
                        min="1"
                        max={selectedEquipment?.cantidadDisponible}
                        value={form.cantidadSolicitada}
                        onChange={(event) => updateForm("cantidadSolicitada", event.target.value)}
                        required
                      />
                    </Field>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Uso">
                      <select
                        className="input-control"
                        value={form.tipoUso}
                        onChange={(event) => updateForm("tipoUso", event.target.value as TipoUso)}
                      >
                        <option value="ACADEMICO">Academico</option>
                        <option value="INVESTIGACION">Investigacion</option>
                        <option value="EXTENSION">Extension</option>
                        <option value="ADMINISTRATIVO">Administrativo</option>
                        <option value="PROYECTO">Proyecto</option>
                        <option value="OTRO">Otro</option>
                      </select>
                    </Field>
                    <Field label="Devolucion estimada">
                      <input
                        className="input-control"
                        type="datetime-local"
                        value={form.fechaDevolucionEstimada}
                        onChange={(event) => updateForm("fechaDevolucionEstimada", event.target.value)}
                        required
                      />
                    </Field>
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

                  <Button className="w-full" type="submit" disabled={pendingAction}>
                    {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                    Registrar solicitud
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {selectedLoan && (
            <Card>
              <CardHeader>
                <CardTitle>Detalle del prestamo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border bg-muted/30 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{selectedLoan.codigo}</span>
                    <span className={getLoanBadgeClass(selectedLoan.estado)}>
                      {formatEnum(selectedLoan.estado)}
                    </span>
                  </div>
                  <p className="mt-2 text-muted-foreground">{selectedLoan.usuarioSolicitante.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    Solicitado: {formatDateTime(selectedLoan.fechaSolicitud)}
                  </p>
                </div>

                <div className="space-y-3">
                  {selectedLoan.detalles.map((detail) => {
                    const pendingReturn = detail.cantidadEntregada - detail.cantidadDevuelta;
                    return (
                      <div key={detail.id} className="rounded-md border p-3 text-sm">
                        <div className="font-medium">{detail.equipo.nombre}</div>
                        <div className="text-xs text-muted-foreground">
                          {detail.equipo.codigoInterno}
                          {detail.equipoUnidad ? ` / ${detail.equipoUnidad.codigoInterno}` : ""}
                        </div>
                        <div className="mt-2 grid grid-cols-4 gap-2 text-center text-xs">
                          <Stat label="Sol." value={detail.cantidadSolicitada} />
                          <Stat label="Apr." value={detail.cantidadAprobada ?? 0} />
                          <Stat label="Ent." value={detail.cantidadEntregada} />
                          <Stat label="Dev." value={detail.cantidadDevuelta} />
                        </div>

                        {canReturn(selectedLoan.estado) && pendingReturn > 0 && hasPermission("devoluciones:registrar") && (
                          <div className="mt-3 grid gap-2 sm:grid-cols-[90px_1fr]">
                            <input
                              className="input-control"
                              type="number"
                              min="0"
                              max={pendingReturn}
                              value={returnQuantities[detail.id] ?? ""}
                              onChange={(event) =>
                                setReturnQuantities((current) => ({
                                  ...current,
                                  [detail.id]: event.target.value
                                }))
                              }
                              placeholder="Cant."
                            />
                            <select
                              className="input-control"
                              value={returnConditionsByDetail[detail.id] ?? "BUENO"}
                              onChange={(event) =>
                                setReturnConditionsByDetail((current) => ({
                                  ...current,
                                  [detail.id]: event.target.value as EstadoCondicionEquipo
                                }))
                              }
                            >
                              {returnConditions.map((condition) => (
                                <option key={condition} value={condition}>
                                  {formatEnum(condition)}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {selectedLoan.estado === "SOLICITADO" && hasPermission("prestamos:aprobar") && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        onClick={() => approveMutation.mutate(selectedLoan.id)}
                        disabled={pendingAction}
                      >
                        <Check className="h-4 w-4" />
                        Aprobar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleReject(selectedLoan)}
                        disabled={pendingAction}
                      >
                        <X className="h-4 w-4" />
                        Rechazar
                      </Button>
                    </div>
                    <Field label="Motivo de rechazo">
                      <input
                        className="input-control"
                        value={rejectReason}
                        onChange={(event) => setRejectReason(event.target.value)}
                      />
                    </Field>
                  </div>
                )}

                {selectedLoan.estado === "APROBADO" && hasPermission("prestamos:entregar") && (
                  <Button
                    className="w-full"
                    type="button"
                    onClick={() => deliverMutation.mutate(selectedLoan.id)}
                    disabled={pendingAction}
                  >
                    <PackageCheck className="h-4 w-4" />
                    Registrar entrega
                  </Button>
                )}

                {canReturn(selectedLoan.estado) && hasPermission("devoluciones:registrar") && (
                  <Button
                    className="w-full"
                    type="button"
                    onClick={() => handleReturn(selectedLoan)}
                    disabled={pendingAction}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Registrar devolucion
                  </Button>
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

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted px-2 py-1">
      <div className="font-semibold">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function getLoanBadgeClass(state: EstadoPrestamo) {
  if (state === "SOLICITADO") {
    return "badge badge-gray";
  }
  if (state === "APROBADO" || state === "ENTREGADO" || state === "DEVUELTO_PARCIAL") {
    return "badge badge-amber";
  }
  if (state === "DEVUELTO") {
    return "badge badge-green";
  }
  return "badge badge-red";
}

function canReturn(state: EstadoPrestamo) {
  return state === "ENTREGADO" || state === "DEVUELTO_PARCIAL" || state === "VENCIDO";
}

function toDatetimeLocal(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
