import { FormEvent, PointerEvent, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  Check,
  ClipboardCheck,
  Copy,
  ExternalLink,
  FileQuestion,
  Loader2,
  Mail as MailIcon,
  PackageCheck,
  Plus,
  RotateCcw,
  Search,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { useAuth } from "@/features/auth/auth-context";
import { apiRequest } from "@/lib/api";
import { formatDateTime, formatEnum } from "@/lib/format";
import type {
  PaginatedActivities,
  PaginatedProjects,
  PaginatedSubjects
} from "@/types/academic";
import type { Facultad, Programa } from "@/types/catalogs";
import type { Equipment, EquipmentUnit, PaginatedResponse } from "@/types/inventory";
import type {
  EstadoCondicionEquipo,
  EstadoPrestamo,
  Loan,
  PaginatedLoans,
  TipoUso
} from "@/types/loans";
import type { PaginatedPeople, RolPersonaPrestamo } from "@/types/people";

interface LoanFormState {
  solicitanteModo: "PERSONA" | "NUEVA";
  personaSolicitanteId: string;
  personaCodigo: string;
  personaNombre: string;
  personaCorreoInstitucional: string;
  personaCarrera: string;
  personaSemestre: string;
  personaRol: RolPersonaPrestamo;
  equipoId: string;
  equipoUnidadId: string;
  cantidadSolicitada: string;
  tipoUso: TipoUso;
  materiaId: string;
  materiaProfesorId: string;
  proyectoId: string;
  actividadId: string;
  fechaRequerida: string;
  fechaDevolucionEstimada: string;
  observaciones: string;
}

type EstadoSolicitudPublicaPrestamo =
  | "RECIBIDA"
  | "EN_REVISION"
  | "CONVERTIDA"
  | "RECHAZADA"
  | "CANCELADA";

interface PublicLoanRequest {
  id: number;
  codigoSolicitud: string;
  equipoId: number | null;
  prestamoConvertidoId: number | null;
  nombreCompleto: string;
  correoInstitucional: string;
  rolSolicitante: RolPersonaPrestamo;
  identificacion: string | null;
  programa: string | null;
  semestre: number | null;
  materia: string | null;
  dependencia: string | null;
  codigoRecurso: string;
  fechaPrestamo: string;
  fechaDevolucionEstimada: string;
  diasPrestamo: number;
  descripcionActividad: string;
  estado: EstadoSolicitudPublicaPrestamo;
  observacionesInternas: string | null;
  equipo: {
    codigoInterno: string;
    nombre: string;
    cantidadDisponible: number;
  } | null;
  prestamoConvertido: {
    id: number;
    codigo: string;
    estado: EstadoPrestamo;
  } | null;
}

interface ReturnEvidencePhoto {
  name: string;
  mimeType: string;
  dataUrl: string;
}

interface ReturnMutationResponse {
  loan: Loan;
  returnId: number;
}

type ReturnSignatureKey = "coordinador" | "admin" | "solicitante";
type DeliverySignatureKey = "coordinador" | "solicitante";

interface PublicApprovalFormState {
  equipoId: string;
  equipoUnidadId: string;
  cantidadAprobada: string;
  fechaPrestamo: string;
  fechaDevolucionEstimada: string;
  tipoUso: TipoUso;
  materiaId: string;
  materiaProfesorId: string;
  proyectoId: string;
  actividadId: string;
  observacionesInternas: string;
}

const initialForm: LoanFormState = {
  solicitanteModo: "PERSONA",
  personaSolicitanteId: "",
  personaCodigo: "",
  personaNombre: "",
  personaCorreoInstitucional: "",
  personaCarrera: "",
  personaSemestre: "",
  personaRol: "ESTUDIANTE",
  equipoId: "",
  equipoUnidadId: "",
  cantidadSolicitada: "1",
  tipoUso: "ACADEMICO",
  materiaId: "",
  materiaProfesorId: "",
  proyectoId: "",
  actividadId: "",
  fechaRequerida: toDatetimeLocal(new Date(Date.now() + 60 * 60 * 1000)),
  fechaDevolucionEstimada: toDatetimeLocal(new Date(Date.now() + 25 * 60 * 60 * 1000)),
  observaciones: ""
};

function publicApprovalInitialState(request: PublicLoanRequest): PublicApprovalFormState {
  return {
    equipoId: request.equipoId ? String(request.equipoId) : "",
    equipoUnidadId: "",
    cantidadAprobada: "1",
    fechaPrestamo: toDatetimeLocal(new Date(request.fechaPrestamo)),
    fechaDevolucionEstimada: toDatetimeLocal(new Date(request.fechaDevolucionEstimada)),
    tipoUso: "OTRO",
    materiaId: "",
    materiaProfesorId: "",
    proyectoId: "",
    actividadId: "",
    observacionesInternas: request.observacionesInternas ?? ""
  };
}

const returnConditions: EstadoCondicionEquipo[] = [
  "BUENO",
  "REGULAR",
  "DANADO",
  "INCOMPLETO",
  "PERDIDO"
];

const personRoleOptions = [
  { value: "ESTUDIANTE", label: "Estudiante", searchText: "estudiante" },
  { value: "PROFESOR", label: "Profesor", searchText: "profesor docente" },
  { value: "ADMINISTRATIVO", label: "Administrativo", searchText: "administrativo" }
];

const useTypeOptions = [
  { value: "ACADEMICO", label: "Academico" },
  { value: "INVESTIGACION", label: "Investigacion" },
  { value: "EXTENSION", label: "Extension" },
  { value: "ADMINISTRATIVO", label: "Administrativo" },
  { value: "PROYECTO", label: "Proyecto" },
  { value: "OTRO", label: "Otro" }
];

export function LoansPage() {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null);
  const [form, setForm] = useState<LoanFormState>(initialForm);
  const [rejectReason, setRejectReason] = useState("");
  const [returnQuantities, setReturnQuantities] = useState<Record<number, string>>({});
  const [returnConditionsByDetail, setReturnConditionsByDetail] = useState<
    Record<number, EstadoCondicionEquipo>
  >({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loanFormOpen, setLoanFormOpen] = useState(false);
  const [publicRequestPage, setPublicRequestPage] = useState(1);
  const [publicRequestNotes, setPublicRequestNotes] = useState<Record<number, string>>({});
  const [publicApprovalRequest, setPublicApprovalRequest] = useState<PublicLoanRequest | null>(null);
  const [publicApprovalForm, setPublicApprovalForm] = useState<PublicApprovalFormState | null>(null);
  const [deliveryPhotos, setDeliveryPhotos] = useState<ReturnEvidencePhoto[]>([]);
  const [deliverySignatures, setDeliverySignatures] = useState<Record<DeliverySignatureKey, string>>({
    coordinador: "",
    solicitante: ""
  });
  const [lastDeliveryActLoanId, setLastDeliveryActLoanId] = useState<number | null>(null);
  const [returnPhotos, setReturnPhotos] = useState<ReturnEvidencePhoto[]>([]);
  const [returnSignatures, setReturnSignatures] = useState<Record<ReturnSignatureKey, string>>({
    coordinador: "",
    admin: "",
    solicitante: ""
  });
  const [lastReturnActId, setLastReturnActId] = useState<number | null>(null);

  const loansQuery = useQuery({
    queryKey: ["loans", search],
    queryFn: () =>
      apiRequest<PaginatedLoans>(
        `/loans?page=1&pageSize=50${search ? `&search=${encodeURIComponent(search)}` : ""}`
      )
  });

  const publicRequestsQuery = useQuery({
    queryKey: ["public-loan-requests"],
    enabled: hasPermission("prestamos:aprobar"),
    queryFn: () => apiRequest<PublicLoanRequest[]>("/loan-requests")
  });

  const equipmentQuery = useQuery({
    queryKey: ["equipment"],
    queryFn: () => apiRequest<PaginatedResponse<Equipment>>("/equipment?page=1&pageSize=100")
  });

  const peopleQuery = useQuery({
    queryKey: ["loan-requester-people"],
    queryFn: () => apiRequest<PaginatedPeople>("/people?page=1&pageSize=200&activo=true")
  });

  const programsQuery = useQuery({
    queryKey: ["programs"],
    queryFn: () => apiRequest<Programa[]>("/programs")
  });

  const facultiesQuery = useQuery({
    queryKey: ["faculties"],
    queryFn: () => apiRequest<Facultad[]>("/faculties")
  });

  const subjectsQuery = useQuery({
    queryKey: ["subjects", "loan-form"],
    queryFn: () => apiRequest<PaginatedSubjects>("/subjects?page=1&pageSize=200&activo=true")
  });

  const projectsQuery = useQuery({
    queryKey: ["projects", "loan-form"],
    queryFn: () => apiRequest<PaginatedProjects>("/projects?page=1&pageSize=200&activo=true")
  });

  const activitiesQuery = useQuery({
    queryKey: ["activities", "loan-form"],
    queryFn: () => apiRequest<PaginatedActivities>("/activities?page=1&pageSize=200&activo=true")
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

  const approvalSelectedEquipment = useMemo(
    () => equipmentQuery.data?.data.find((item) => String(item.id) === publicApprovalForm?.equipoId),
    [equipmentQuery.data, publicApprovalForm?.equipoId]
  );

  const approvalUnitsQuery = useQuery({
    queryKey: ["equipment-units", "public-approval", publicApprovalForm?.equipoId],
    enabled: Boolean(approvalSelectedEquipment?.requiereSerial && publicApprovalForm?.equipoId),
    queryFn: () => apiRequest<EquipmentUnit[]>(`/equipment/${publicApprovalForm?.equipoId}/units`)
  });

  const loans = useMemo(() => loansQuery.data?.data ?? [], [loansQuery.data]);
  const equipment = useMemo(() => equipmentQuery.data?.data ?? [], [equipmentQuery.data]);
  const requesterPeople = useMemo(() => peopleQuery.data?.data ?? [], [peopleQuery.data]);
  const programs = useMemo(() => programsQuery.data ?? [], [programsQuery.data]);
  const faculties = useMemo(() => facultiesQuery.data ?? [], [facultiesQuery.data]);
  const subjects = useMemo(() => subjectsQuery.data?.data ?? [], [subjectsQuery.data]);
  const projects = useMemo(() => projectsQuery.data?.data ?? [], [projectsQuery.data]);
  const activities = useMemo(() => activitiesQuery.data?.data ?? [], [activitiesQuery.data]);
  const selectedLoan = loans.find((loan) => loan.id === selectedLoanId) ?? loans[0] ?? null;
  const publicRequests = publicRequestsQuery.data ?? [];
  const publicRequestPageSize = 15;
  const publicRequestTotalPages = Math.max(1, Math.ceil(publicRequests.length / publicRequestPageSize));
  const paginatedPublicRequests = publicRequests.slice(
    (Math.min(publicRequestPage, publicRequestTotalPages) - 1) * publicRequestPageSize,
    Math.min(publicRequestPage, publicRequestTotalPages) * publicRequestPageSize
  );

  const requesterOptions = useMemo(
    () =>
      requesterPeople.map((requester) => ({
        value: String(requester.id),
        label: `${requester.codigo} - ${requester.nombre}`,
        description: requester.correoInstitucional ?? formatEnum(requester.rol),
        searchText: `${requester.codigo} ${requester.nombre} ${requester.correoInstitucional ?? ""} ${requester.carrera ?? ""}`
      })),
    [requesterPeople]
  );
  const personProgramOptions = useMemo(
    () =>
      programs.map((program) => ({
        value: program.nombre,
        label: program.nombre,
        description: `${program.codigo}${program.facultad ? ` - ${program.facultad.sigla}` : ""}`,
        searchText: `${program.codigo} ${program.nombre} ${program.facultad?.nombre ?? ""} ${program.facultad?.sigla ?? ""}`
      })),
    [programs]
  );
  const personFacultyOptions = useMemo(
    () =>
      faculties.map((faculty) => ({
        value: faculty.nombre,
        label: `${faculty.sigla} - ${faculty.nombre}`,
        description: "Facultad",
        searchText: `${faculty.sigla} ${faculty.nombre}`
      })),
    [faculties]
  );

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

  const subjectOptions = useMemo(
    () =>
      subjects.map((subject) => ({
        value: String(subject.id),
        label: `${subject.codigo} - ${subject.nombre}`,
        description: subject.programa?.nombre,
        searchText: `${subject.codigo} ${subject.nombre} ${subject.programa?.nombre ?? ""} ${subject.profesores.map((professor) => professor.profesor.nombre).join(" ")}`
      })),
    [subjects]
  );

  const selectedSubject = useMemo(
    () => subjects.find((subject) => String(subject.id) === form.materiaId),
    [subjects, form.materiaId]
  );

  const subjectProfessorOptions = useMemo(
    () =>
      (selectedSubject?.profesores ?? [])
        .filter((professor) => professor.activo)
        .map((professor) => ({
          value: String(professor.id),
          label: `${professor.profesor.nombre} / ${professor.grupo}`,
          description: professor.periodo ?? professor.profesor.correo,
          searchText: `${professor.profesor.nombre} ${professor.profesor.correo} ${professor.grupo} ${professor.periodo ?? ""}`
        })),
    [selectedSubject]
  );

  const approvalSelectedSubject = useMemo(
    () => subjects.find((subject) => String(subject.id) === publicApprovalForm?.materiaId),
    [subjects, publicApprovalForm?.materiaId]
  );

  const approvalSubjectProfessorOptions = useMemo(
    () =>
      (approvalSelectedSubject?.profesores ?? [])
        .filter((professor) => professor.activo)
        .map((professor) => ({
          value: String(professor.id),
          label: `${professor.profesor.nombre} / ${professor.grupo}`,
          description: professor.periodo ?? professor.profesor.correo,
          searchText: `${professor.profesor.nombre} ${professor.profesor.correo} ${professor.grupo} ${professor.periodo ?? ""}`
        })),
    [approvalSelectedSubject]
  );

  const projectOptions = useMemo(
    () =>
      projects.map((project) => ({
        value: String(project.id),
        label: project.nombre,
        description: project.semillero?.nombre ?? formatEnum(project.tipo),
        searchText: `${project.nombre} ${project.tipo} ${project.semillero?.nombre ?? ""}`
      })),
    [projects]
  );

  const activityOptions = useMemo(
    () =>
      activities.map((activity) => ({
        value: String(activity.id),
        label: activity.nombre,
        description: activity.semillero?.nombre ?? formatEnum(activity.tipo),
        searchText: `${activity.nombre} ${activity.tipo} ${activity.semillero?.nombre ?? ""}`
      })),
    [activities]
  );

  const unitOptions = useMemo(
    () =>
      (unitsQuery.data ?? [])
        .filter((unit) => unit.estado === "DISPONIBLE")
        .map((unit) => ({
          value: String(unit.id),
          label: `${unit.codigoInterno}${unit.serial ? ` / ${unit.serial}` : ""}`,
          description: formatEnum(unit.estado),
          searchText: `${unit.codigoInterno} ${unit.serial ?? ""}`
        })),
    [unitsQuery.data]
  );
  const approvalUnitOptions = useMemo(
    () =>
      (approvalUnitsQuery.data ?? [])
        .filter((unit) => unit.estado === "DISPONIBLE")
        .map((unit) => ({
          value: String(unit.id),
          label: `${unit.codigoInterno}${unit.serial ? ` / ${unit.serial}` : ""}`,
          description: formatEnum(unit.estado),
          searchText: `${unit.codigoInterno} ${unit.serial ?? ""}`
        })),
    [approvalUnitsQuery.data]
  );
  const returnConditionOptions = useMemo(
    () =>
      returnConditions.map((condition) => ({
        value: condition,
        label: formatEnum(condition),
        searchText: `${condition} ${formatEnum(condition)}`
      })),
    []
  );

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
          personaSolicitanteId:
            payload.solicitanteModo === "PERSONA" && payload.personaSolicitanteId
              ? Number(payload.personaSolicitanteId)
              : undefined,
          personaCodigo: payload.solicitanteModo === "NUEVA" ? payload.personaCodigo : undefined,
          personaNombre: payload.solicitanteModo === "NUEVA" ? payload.personaNombre : undefined,
          personaCorreoInstitucional:
            payload.solicitanteModo === "NUEVA" ? payload.personaCorreoInstitucional : undefined,
          personaCarrera: payload.solicitanteModo === "NUEVA" ? payload.personaCarrera : undefined,
          personaSemestre:
            payload.solicitanteModo === "NUEVA" && payload.personaSemestre
              ? Number(payload.personaSemestre)
              : undefined,
          personaRol: payload.solicitanteModo === "NUEVA" ? payload.personaRol : undefined,
          tipoUso: payload.tipoUso,
          materiaId: payload.materiaId ? Number(payload.materiaId) : undefined,
          materiaProfesorId: payload.materiaProfesorId
            ? Number(payload.materiaProfesorId)
            : undefined,
          proyectoId: payload.proyectoId ? Number(payload.proyectoId) : undefined,
          actividadId: payload.actividadId ? Number(payload.actividadId) : undefined,
          fechaRequerida: new Date(payload.fechaRequerida).toISOString(),
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
      setLoanFormOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["loans"] }),
        queryClient.invalidateQueries({ queryKey: ["loan-requester-people"] }),
        queryClient.invalidateQueries({ queryKey: ["people"] })
      ]);
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
    mutationFn: (loan: Loan) =>
      apiRequest<Loan>(`/loans/${loan.id}/deliver`, {
        method: "PATCH",
        body: JSON.stringify({
          evidencias: [
            ...deliveryPhotos.map((photo) => ({
              tipo: "FOTO",
              nombreArchivo: photo.name,
              mimeType: photo.mimeType,
              contenidoBase64: photo.dataUrl
            })),
            {
              tipo: "FIRMA_COORDINADOR",
              mimeType: "image/png",
              contenidoBase64: deliverySignatures.coordinador,
              firmanteNombre: user?.nombre ?? "Coordinacion"
            },
            {
              tipo: "FIRMA_SOLICITANTE",
              mimeType: "image/png",
              contenidoBase64: deliverySignatures.solicitante,
              firmanteNombre: getLoanRequesterName(loan)
            }
          ]
        })
      }),
    onSuccess: async (loan) => {
      setFeedback("Entrega registrada.");
      setSelectedLoanId(loan.id);
      setLastDeliveryActLoanId(loan.id);
      setDeliveryPhotos([]);
      setDeliverySignatures({ coordinador: "", solicitante: "" });
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
      apiRequest<ReturnMutationResponse>(`/loans/${loan.id}/returns`, {
        method: "POST",
        body: JSON.stringify({
          detalles: loan.detalles
            .map((detail) => ({
              prestamoDetalleId: detail.id,
              cantidad: Number(returnQuantities[detail.id] ?? 0),
              estadoDevolucion: returnConditionsByDetail[detail.id] ?? "BUENO"
            }))
            .filter((detail) => detail.cantidad > 0),
          evidencias: [
            ...returnPhotos.map((photo) => ({
              tipo: "FOTO",
              nombreArchivo: photo.name,
              mimeType: photo.mimeType,
              contenidoBase64: photo.dataUrl
            })),
            {
              tipo: "FIRMA_COORDINADOR",
              mimeType: "image/png",
              contenidoBase64: returnSignatures.coordinador,
              firmanteNombre: user?.nombre ?? "Coordinacion"
            },
            {
              tipo: "FIRMA_ADMIN",
              mimeType: "image/png",
              contenidoBase64: returnSignatures.admin,
              firmanteNombre: "Administrador del sistema"
            },
            {
              tipo: "FIRMA_SOLICITANTE",
              mimeType: "image/png",
              contenidoBase64: returnSignatures.solicitante,
              firmanteNombre: getLoanRequesterName(loan)
            }
          ]
        })
      }),
    onSuccess: async (result) => {
      setFeedback("Devolucion registrada.");
      setSelectedLoanId(result.loan.id);
      setLastReturnActId(result.returnId);
      setReturnQuantities({});
      setReturnConditionsByDetail({});
      setReturnPhotos([]);
      setReturnSignatures({ coordinador: "", admin: "", solicitante: "" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["loans"] }),
        queryClient.invalidateQueries({ queryKey: ["equipment"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory-movements"] })
      ]);
    },
    onError: setErrorFeedback
  });

  const publicRequestMutation = useMutation({
    mutationFn: ({
      requestId,
      estado,
      observacionesInternas,
      approval
    }: {
      requestId: number;
      estado: EstadoSolicitudPublicaPrestamo;
      observacionesInternas?: string;
      approval?: Omit<PublicApprovalFormState, "observacionesInternas">;
    }) =>
      apiRequest<PublicLoanRequest>(`/loan-requests/${requestId}/status`, {
        method: "PATCH",
        body: JSON.stringify({
          estado,
          observacionesInternas,
          ...(approval
            ? {
                equipoId: approval.equipoId ? Number(approval.equipoId) : undefined,
                equipoUnidadId: approval.equipoUnidadId
                  ? Number(approval.equipoUnidadId)
                  : undefined,
                cantidadAprobada: approval.cantidadAprobada
                  ? Number(approval.cantidadAprobada)
                  : undefined,
                fechaPrestamo: new Date(approval.fechaPrestamo).toISOString(),
                fechaDevolucionEstimada: new Date(approval.fechaDevolucionEstimada).toISOString(),
                tipoUso: approval.tipoUso,
                materiaId: approval.materiaId ? Number(approval.materiaId) : undefined,
                materiaProfesorId: approval.materiaProfesorId
                  ? Number(approval.materiaProfesorId)
                  : undefined,
                proyectoId: approval.proyectoId ? Number(approval.proyectoId) : undefined,
                actividadId: approval.actividadId ? Number(approval.actividadId) : undefined
              }
            : {})
        })
      }),
    onSuccess: async (request) => {
      setFeedback(
        request.prestamoConvertido
          ? `Solicitud aprobada y convertida en prestamo ${request.prestamoConvertido.codigo}.`
          : "Solicitud publica actualizada."
      );
      if (request.prestamoConvertido) {
        setSelectedLoanId(request.prestamoConvertido.id);
        setPublicApprovalRequest(null);
        setPublicApprovalForm(null);
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["public-loan-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["loans"] }),
        queryClient.invalidateQueries({ queryKey: ["equipment"] })
      ]);
    },
    onError: setErrorFeedback
  });

  const dueSoonEmailMutation = useMutation({
    mutationFn: (loanId: number) =>
      apiRequest<{ sent: boolean; to: string }>(`/loans/${loanId}/due-soon-email`, {
        method: "POST"
      }),
    onSuccess: (result) => setFeedback(`Aviso de vencimiento enviado a ${result.to}.`),
    onError: setErrorFeedback
  });

  function setErrorFeedback(error: unknown) {
    setFeedback(error instanceof Error ? error.message : "No fue posible completar la accion.");
  }

  function updateForm<K extends keyof LoanFormState>(key: K, value: LoanFormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "equipoId" ? { equipoUnidadId: "", cantidadSolicitada: "1" } : {}),
      ...(key === "materiaId" ? { materiaProfesorId: "" } : {}),
      ...(key === "personaRol" ? { personaCarrera: "", personaSemestre: value === "ESTUDIANTE" ? current.personaSemestre : "" } : {})
    }));
  }

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    if (form.solicitanteModo === "PERSONA" && !form.personaSolicitanteId) {
      setFeedback("Selecciona la persona solicitante del prestamo.");
      return;
    }
    if (
      form.solicitanteModo === "NUEVA" &&
      (!form.personaCodigo.trim() ||
        !form.personaNombre.trim() ||
        !form.personaCorreoInstitucional.trim())
    ) {
      setFeedback("Registra codigo, nombre y correo institucional de la persona.");
      return;
    }
    if (form.solicitanteModo === "NUEVA" && !form.personaCarrera.trim()) {
      setFeedback(
        form.personaRol === "ADMINISTRATIVO"
          ? "Registra la dependencia de la persona."
          : form.personaRol === "PROFESOR"
            ? "Selecciona la facultad del profesor."
            : "Selecciona el programa del estudiante."
      );
      return;
    }
    if (new Date(form.fechaDevolucionEstimada) <= new Date(form.fechaRequerida)) {
      setFeedback("La devolucion estimada debe ser posterior a la fecha requerida.");
      return;
    }
    if (!form.equipoId) {
      setFeedback("Selecciona un equipo.");
      return;
    }
    if (form.tipoUso === "ACADEMICO" && !form.materiaId) {
      setFeedback("Selecciona la materia asociada al prestamo academico.");
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
    if (!returnPhotos.length) {
      setFeedback("Adjunta al menos una foto de los equipos devueltos.");
      return;
    }
    if (!returnSignatures.coordinador || !returnSignatures.admin || !returnSignatures.solicitante) {
      setFeedback("Registra las firmas de coordinacion, administrador y solicitante.");
      return;
    }
    returnMutation.mutate(loan);
  }

  function handleDeliver(loan: Loan) {
    setFeedback(null);
    if (!deliveryPhotos.length) {
      setFeedback("Adjunta al menos una foto de los equipos entregados.");
      return;
    }
    if (!deliverySignatures.coordinador || !deliverySignatures.solicitante) {
      setFeedback("Registra las firmas de coordinacion y solicitante.");
      return;
    }
    deliverMutation.mutate(loan);
  }

  async function handleReturnPhotos(files: FileList | null) {
    if (!files?.length) {
      return;
    }
    try {
      const photos = await Promise.all(
        Array.from(files).map(async (file) => ({
          name: file.name,
          mimeType: file.type,
          dataUrl: await fileToDataUrl(file)
        }))
      );
      setReturnPhotos((current) => [...current, ...photos].slice(0, 6));
    } catch (error) {
      setErrorFeedback(error);
    }
  }

  async function handleDeliveryPhotos(files: FileList | null) {
    if (!files?.length) {
      return;
    }
    try {
      const photos = await Promise.all(
        Array.from(files).map(async (file) => ({
          name: file.name,
          mimeType: file.type,
          dataUrl: await fileToDataUrl(file)
        }))
      );
      setDeliveryPhotos((current) => [...current, ...photos].slice(0, 6));
    } catch (error) {
      setErrorFeedback(error);
    }
  }

  function openPublicApproval(request: PublicLoanRequest) {
    setFeedback(null);
    setPublicApprovalRequest(request);
    setPublicApprovalForm({
      ...publicApprovalInitialState(request),
      observacionesInternas:
        publicRequestNotes[request.id] ?? request.observacionesInternas ?? ""
    });
  }

  function updatePublicApprovalForm<K extends keyof PublicApprovalFormState>(
    key: K,
    value: PublicApprovalFormState[K]
  ) {
    setPublicApprovalForm((current) =>
      current
        ? {
            ...current,
            [key]: value,
            ...(key === "equipoId" ? { equipoUnidadId: "", cantidadAprobada: "1" } : {}),
            ...(key === "materiaId" ? { materiaProfesorId: "" } : {})
          }
        : current
    );
  }

  function handleApprovePublicRequest() {
    if (!publicApprovalRequest || !publicApprovalForm) {
      return;
    }
    setFeedback(null);
    if (!publicApprovalForm.equipoId) {
      setFeedback("Selecciona el equipo que se entregara.");
      return;
    }
    if (
      approvalSelectedEquipment?.requiereSerial &&
      !publicApprovalForm.equipoUnidadId
    ) {
      setFeedback("Selecciona la unidad del equipo serializado.");
      return;
    }
    if (new Date(publicApprovalForm.fechaDevolucionEstimada) <= new Date(publicApprovalForm.fechaPrestamo)) {
      setFeedback("La devolucion estimada debe ser posterior a la fecha de prestamo.");
      return;
    }
    if (publicApprovalForm.tipoUso === "ACADEMICO" && !publicApprovalForm.materiaId) {
      setFeedback("Selecciona la materia para aprobar el prestamo academico.");
      return;
    }

    publicRequestMutation.mutate({
      requestId: publicApprovalRequest.id,
      estado: "CONVERTIDA",
      observacionesInternas: publicApprovalForm.observacionesInternas || undefined,
      approval: {
        equipoId: publicApprovalForm.equipoId,
        equipoUnidadId: publicApprovalForm.equipoUnidadId,
        cantidadAprobada: publicApprovalForm.cantidadAprobada,
        fechaPrestamo: publicApprovalForm.fechaPrestamo,
        fechaDevolucionEstimada: publicApprovalForm.fechaDevolucionEstimada,
        tipoUso: publicApprovalForm.tipoUso,
        materiaId: publicApprovalForm.materiaId,
        materiaProfesorId: publicApprovalForm.materiaProfesorId,
        proyectoId: publicApprovalForm.proyectoId,
        actividadId: publicApprovalForm.actividadId
      }
    });
  }

  function updatePublicRequestStatus(request: PublicLoanRequest, estado: EstadoSolicitudPublicaPrestamo) {
    setFeedback(null);
    const note = publicRequestNotes[request.id]?.trim();
    if (estado === "RECHAZADA" && !note) {
      setFeedback("Para rechazar la solicitud publica escribe una nota.");
      return;
    }
    publicRequestMutation.mutate({
      requestId: request.id,
      estado,
      observacionesInternas: note || undefined
    });
  }

  async function copyPublicFormLink() {
    const publicUrl = `${window.location.origin}/solicitar-prestamo`;
    await navigator.clipboard.writeText(publicUrl);
    setFeedback("Link del formulario publico copiado.");
  }

  const pendingAction =
    createMutation.isPending ||
    approveMutation.isPending ||
    rejectMutation.isPending ||
    deliverMutation.isPending ||
    returnMutation.isPending ||
    publicRequestMutation.isPending ||
    dueSoonEmailMutation.isPending;

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Prestamos y devoluciones</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Solicitudes, aprobaciones, entregas y recepcion de equipos.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button type="button" variant="outline" onClick={copyPublicFormLink}>
            <Copy className="h-4 w-4" />
            Copiar link formulario
          </Button>
          {hasPermission("prestamos:solicitar") && (
            <Button type="button" onClick={() => setLoanFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Nueva solicitud
            </Button>
          )}
          <div className="flex h-10 items-center gap-2 rounded-md border bg-white px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              className="h-full w-64 bg-transparent text-sm outline-none"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar prestamo"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Prestamos" value={summary.total} icon={<ClipboardCheck className="h-4 w-4" />} />
        <Metric label="Solicitados" value={summary.solicitados} icon={<Plus className="h-4 w-4" />} />
        <Metric label="Aprobados" value={summary.aprobados} icon={<Check className="h-4 w-4" />} />
        <Metric label="En curso" value={summary.enCurso} icon={<PackageCheck className="h-4 w-4" />} />
      </section>

      <section className="space-y-4">
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
                        <div>{getLoanRequesterName(loan)}</div>
                        <div className="text-xs text-muted-foreground">{getLoanRequesterEmail(loan)}</div>
                      </td>
                      <td className="px-4 py-3">
                        {loan.detalles.map((detail) => (
                          <div key={detail.id}>
                            {detail.equipo.codigoInterno} - {detail.equipo.nombre}
                          </div>
                        ))}
                      </td>
                      <td className="px-4 py-3">
                        <div>{formatEnum(loan.tipoUso)}</div>
                        <div className="text-xs text-muted-foreground">
                          {getLoanAcademicContext(loan)}
                        </div>
                      </td>
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
          {hasPermission("prestamos:aprobar") && (
            <Card>
              <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileQuestion className="h-4 w-4 text-primary" />
                    Solicitudes publicas
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Revision de solicitudes enviadas sin iniciar sesion. Se muestran 15 por pagina.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {publicRequestsQuery.isFetching && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                  <span>{publicRequests.length} registros</span>
                </div>
              </CardHeader>
              <CardContent className="hidden">
                {publicRequestsQuery.isFetching && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Cargando solicitudes...
                  </div>
                )}

                {(publicRequestsQuery.data ?? []).slice(0, 5).map((request) => (
                  <div key={request.id} className="rounded-md border bg-white p-3 text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{request.nombreCompleto}</p>
                        <p className="text-xs text-muted-foreground">{request.correoInstitucional}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatEnum(request.rolSolicitante)}
                          {request.identificacion ? ` - ${request.identificacion}` : ""}
                        </p>
                      </div>
                      <span className={getPublicRequestBadgeClass(request.estado)}>
                        {formatEnum(request.estado)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {publicApplicantContext(request)}
                    </p>
                    <p className="mt-2 font-medium text-[#10201a]">
                      {request.equipo
                        ? `${request.equipo.codigoInterno} - ${request.equipo.nombre}`
                        : request.codigoRecurso}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDateTime(request.fechaPrestamo)} - {formatDateTime(request.fechaDevolucionEstimada)} · {request.diasPrestamo} dias
                    </p>
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                      {request.descripcionActividad}
                    </p>
                    {request.prestamoConvertido && (
                      <button
                        className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary"
                        type="button"
                        onClick={() => setSelectedLoanId(request.prestamoConvertido?.id ?? null)}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Prestamo {request.prestamoConvertido.codigo}
                      </button>
                    )}
                    <textarea
                      className="textarea-control mt-3 min-h-20 text-xs"
                      value={publicRequestNotes[request.id] ?? request.observacionesInternas ?? ""}
                      onChange={(event) =>
                        setPublicRequestNotes((current) => ({
                          ...current,
                          [request.id]: event.target.value
                        }))
                      }
                      placeholder="Nota interna si se rechaza o requiere revision."
                    />
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={pendingAction || request.estado === "CONVERTIDA"}
                        onClick={() => updatePublicRequestStatus(request, "EN_REVISION")}
                      >
                        <Check className="h-4 w-4" />
                        En revision
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={pendingAction || request.estado === "CONVERTIDA"}
                        onClick={() => openPublicApproval(request)}
                      >
                        <MailIcon className="h-4 w-4" />
                        Aprobar
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={pendingAction || request.estado === "CONVERTIDA"}
                        onClick={() => updatePublicRequestStatus(request, "RECHAZADA")}
                      >
                        <X className="h-4 w-4" />
                        Rechazar
                      </Button>
                    </div>
                  </div>
                ))}

                {!publicRequestsQuery.isFetching && !(publicRequestsQuery.data ?? []).length && (
                  <p className="rounded-md border bg-muted/30 px-3 py-4 text-center text-sm text-muted-foreground">
                    No hay solicitudes publicas pendientes.
                  </p>
                )}
              </CardContent>
              <CardContent>
                <div className="overflow-x-auto rounded-md border">
                  <table className="w-full min-w-[1280px] text-sm">
                    <thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-3 py-3 text-left font-semibold">Codigo</th>
                        <th className="px-3 py-3 text-left font-semibold">Solicitante</th>
                        <th className="px-3 py-3 text-left font-semibold">Contexto</th>
                        <th className="px-3 py-3 text-left font-semibold">Recurso</th>
                        <th className="px-3 py-3 text-left font-semibold">Fechas</th>
                        <th className="px-3 py-3 text-left font-semibold">Actividad / nota</th>
                        <th className="px-3 py-3 text-left font-semibold">Estado</th>
                        <th className="px-3 py-3 text-right font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedPublicRequests.map((request) => (
                        <tr key={request.id} className="border-t bg-white align-top">
                          <td className="px-3 py-3 font-mono text-xs font-semibold">{request.codigoSolicitud}</td>
                          <td className="px-3 py-3">
                            <div className="font-medium">{request.nombreCompleto}</div>
                            <div className="text-xs text-muted-foreground">{request.correoInstitucional}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {formatEnum(request.rolSolicitante)}
                              {request.identificacion ? ` - ${request.identificacion}` : ""}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-xs text-muted-foreground">
                            {publicApplicantContext(request)}
                          </td>
                          <td className="px-3 py-3">
                            <div className="font-medium">
                              {request.equipo
                                ? `${request.equipo.codigoInterno} - ${request.equipo.nombre}`
                                : request.codigoRecurso}
                            </div>
                            {request.equipo && (
                              <div className="text-xs text-muted-foreground">
                                {request.equipo.cantidadDisponible} disponibles
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-3 text-xs text-muted-foreground">
                            <div>{formatDateTime(request.fechaPrestamo)}</div>
                            <div>{formatDateTime(request.fechaDevolucionEstimada)}</div>
                            <div className="font-medium text-foreground">{request.diasPrestamo} dias</div>
                          </td>
                          <td className="px-3 py-3">
                            <div className="max-w-[260px] text-xs text-muted-foreground">
                              {request.descripcionActividad}
                            </div>
                            <textarea
                              className="textarea-control mt-2 min-h-16 text-xs"
                              value={publicRequestNotes[request.id] ?? request.observacionesInternas ?? ""}
                              onChange={(event) =>
                                setPublicRequestNotes((current) => ({
                                  ...current,
                                  [request.id]: event.target.value
                                }))
                              }
                              placeholder="Nota interna."
                            />
                          </td>
                          <td className="px-3 py-3">
                            <span className={getPublicRequestBadgeClass(request.estado)}>
                              {formatEnum(request.estado)}
                            </span>
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex justify-end gap-2">
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={pendingAction}
                                onClick={() => updatePublicRequestStatus(request, "EN_REVISION")}
                              >
                                <Check className="h-4 w-4" />
                                En revision
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={pendingAction}
                                onClick={() => updatePublicRequestStatus(request, "CONVERTIDA")}
                              >
                                <MailIcon className="h-4 w-4" />
                                Aprobar
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={pendingAction}
                                onClick={() => updatePublicRequestStatus(request, "RECHAZADA")}
                              >
                                <X className="h-4 w-4" />
                                Rechazar
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {!publicRequestsQuery.isFetching && !paginatedPublicRequests.length && (
                        <tr>
                          <td className="px-4 py-8 text-center text-muted-foreground" colSpan={8}>
                            No hay solicitudes publicas pendientes.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Pagina {Math.min(publicRequestPage, publicRequestTotalPages)} de {publicRequestTotalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={publicRequestPage <= 1}
                      onClick={() => setPublicRequestPage((current) => Math.max(1, current - 1))}
                    >
                      Anterior
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={publicRequestPage >= publicRequestTotalPages}
                      onClick={() => setPublicRequestPage((current) => Math.min(publicRequestTotalPages, current + 1))}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {hasPermission("prestamos:solicitar") && loanFormOpen && (
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 px-4 py-8">
              <Card className="w-full max-w-3xl">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-primary" />
                    Nueva solicitud
                  </CardTitle>
                  <Button type="button" variant="ghost" size="icon" aria-label="Cerrar" onClick={() => setLoanFormOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
              </CardHeader>
              <CardContent>
                <form className="space-y-4" onSubmit={handleCreate}>
                  <div className="grid gap-3 rounded-md border bg-muted/20 p-3">
                    <Field label="Persona que solicita el prestamo">
                      <SearchableSelect
                        options={requesterOptions}
                        value={form.personaSolicitanteId}
                        onChange={(value) => updateForm("personaSolicitanteId", value)}
                        placeholder="Seleccionar persona registrada"
                        searchPlaceholder="Buscar por nombre, codigo o correo"
                        emptyLabel="Sin persona"
                        required={form.solicitanteModo === "PERSONA"}
                        disabled={form.solicitanteModo === "NUEVA"}
                      />
                    </Field>
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={form.solicitanteModo === "NUEVA"}
                        onChange={(event) =>
                          setForm((current) => ({
                            ...current,
                            solicitanteModo: event.target.checked ? "NUEVA" : "PERSONA",
                            personaSolicitanteId: event.target.checked ? "" : current.personaSolicitanteId
                          }))
                        }
                      />
                      La persona no esta registrada
                    </label>
                  </div>

                  {form.solicitanteModo === "NUEVA" && (
                    <div className="grid gap-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label="Codigo">
                          <input
                            className="input-control"
                            value={form.personaCodigo}
                            onChange={(event) => updateForm("personaCodigo", event.target.value)}
                            required
                          />
                        </Field>
                        <Field label="Rol">
                          <SearchableSelect
                            options={personRoleOptions}
                            value={form.personaRol}
                            onChange={(value) => updateForm("personaRol", value as RolPersonaPrestamo)}
                            placeholder="Seleccionar rol"
                            searchPlaceholder="Buscar rol"
                            emptyLabel="Seleccionar"
                          />
                        </Field>
                      </div>
                      <Field label="Nombre completo">
                        <input
                          className="input-control"
                          value={form.personaNombre}
                          onChange={(event) => updateForm("personaNombre", event.target.value)}
                          required
                        />
                      </Field>
                      <Field label="Correo institucional">
                        <input
                          className="input-control"
                          type="email"
                          value={form.personaCorreoInstitucional}
                          onChange={(event) => updateForm("personaCorreoInstitucional", event.target.value)}
                          required
                        />
                      </Field>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Field label={personAffiliationLabel(form.personaRol)}>
                          {form.personaRol === "ADMINISTRATIVO" ? (
                            <input
                              className="input-control"
                              value={form.personaCarrera}
                              onChange={(event) => updateForm("personaCarrera", event.target.value)}
                              placeholder="Ej. Laboratorios FCI, Decanatura, Soporte"
                              required
                            />
                          ) : (
                            <SearchableSelect
                              options={form.personaRol === "PROFESOR" ? personFacultyOptions : personProgramOptions}
                              value={form.personaCarrera}
                              onChange={(value) => updateForm("personaCarrera", value)}
                              placeholder={form.personaRol === "PROFESOR" ? "Seleccionar facultad" : "Seleccionar programa"}
                              searchPlaceholder={form.personaRol === "PROFESOR" ? "Buscar facultad" : "Buscar programa"}
                              emptyLabel="Seleccionar"
                              required
                            />
                          )}
                        </Field>
                        <Field label="Semestre">
                          <input
                            className="input-control"
                            type="number"
                            min="1"
                            max="20"
                            disabled={form.personaRol !== "ESTUDIANTE"}
                            value={form.personaSemestre}
                            onChange={(event) => updateForm("personaSemestre", event.target.value)}
                          />
                        </Field>
                      </div>
                    </div>
                  )}

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

                  {selectedEquipment?.requiereSerial ? (
                    <Field label="Unidad">
                      <SearchableSelect
                        options={unitOptions}
                        value={form.equipoUnidadId}
                        onChange={(value) => updateForm("equipoUnidadId", value)}
                        placeholder="Seleccionar unidad"
                        searchPlaceholder="Buscar por codigo o serial"
                        emptyLabel="Seleccionar"
                        required
                      />
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
                    <Field label="Fecha requerida">
                      <input
                        className="input-control"
                        type="datetime-local"
                        value={form.fechaRequerida}
                        onChange={(event) => updateForm("fechaRequerida", event.target.value)}
                        required
                      />
                    </Field>
                    <Field label="Devolucion estimada">
                      <input
                        className="input-control"
                        type="datetime-local"
                        min={form.fechaRequerida}
                        value={form.fechaDevolucionEstimada}
                        onChange={(event) => updateForm("fechaDevolucionEstimada", event.target.value)}
                        required
                      />
                    </Field>
                  </div>

                  <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    Duracion estimada:{" "}
                    <span className="font-semibold text-foreground">
                      {calculateLoanDays(form.fechaRequerida, form.fechaDevolucionEstimada)} dias
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Uso">
                      <SearchableSelect
                        options={useTypeOptions}
                        value={form.tipoUso}
                        onChange={(value) => updateForm("tipoUso", value as TipoUso)}
                        placeholder="Seleccionar uso"
                        searchPlaceholder="Buscar uso"
                        emptyLabel="Seleccionar"
                      />
                    </Field>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Materia">
                      <SearchableSelect
                        options={subjectOptions}
                        value={form.materiaId}
                        onChange={(value) => updateForm("materiaId", value)}
                        placeholder="Seleccionar materia"
                        searchPlaceholder="Buscar materia"
                        emptyLabel="Sin materia"
                        required={form.tipoUso === "ACADEMICO"}
                      />
                    </Field>
                    <Field label="Profesor / grupo">
                      <SearchableSelect
                        options={subjectProfessorOptions}
                        value={form.materiaProfesorId}
                        onChange={(value) => updateForm("materiaProfesorId", value)}
                        placeholder="Seleccionar grupo"
                        searchPlaceholder="Buscar profesor o grupo"
                        emptyLabel="Sin grupo"
                        disabled={!form.materiaId}
                      />
                    </Field>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Proyecto">
                      <SearchableSelect
                        options={projectOptions}
                        value={form.proyectoId}
                        onChange={(value) => updateForm("proyectoId", value)}
                        placeholder="Seleccionar proyecto"
                        searchPlaceholder="Buscar proyecto"
                        emptyLabel="Sin proyecto"
                      />
                    </Field>
                    <Field label="Actividad">
                      <SearchableSelect
                        options={activityOptions}
                        value={form.actividadId}
                        onChange={(value) => updateForm("actividadId", value)}
                        placeholder="Seleccionar actividad"
                        searchPlaceholder="Buscar actividad"
                        emptyLabel="Sin actividad"
                      />
                    </Field>
                  </div>

                  <Field label="Descripcion de la actividad / observaciones">
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
            </div>
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
                  <p className="mt-2 text-muted-foreground">{getLoanRequesterName(selectedLoan)}</p>
                  <p className="text-xs text-muted-foreground">
                    Solicitado: {formatDateTime(selectedLoan.fechaSolicitud)}
                  </p>
                  {hasPermission("prestamos:aprobar") && (
                    <Button
                      className="mt-3"
                      size="sm"
                      type="button"
                      variant="outline"
                      disabled={pendingAction}
                      onClick={() => dueSoonEmailMutation.mutate(selectedLoan.id)}
                    >
                      <MailIcon className="h-4 w-4" />
                      Avisar vencimiento
                    </Button>
                  )}
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
                            <SearchableSelect
                              options={returnConditionOptions}
                              value={returnConditionsByDetail[detail.id] ?? "BUENO"}
                              onChange={(value) =>
                                setReturnConditionsByDetail((current) => ({
                                  ...current,
                                  [detail.id]: value as EstadoCondicionEquipo
                                }))
                              }
                              placeholder="Condicion"
                              searchPlaceholder="Buscar condicion"
                              emptyLabel="Condicion"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {canReturn(selectedLoan.estado) && hasPermission("devoluciones:registrar") && (
                  <div className="space-y-4 rounded-md border bg-muted/20 p-3">
                    <div>
                      <h3 className="text-sm font-semibold">Evidencias de devolucion</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Adjunta fotos y registra las tres firmas para generar el acta.
                      </p>
                    </div>
                    <label className="block text-sm font-medium">
                      Fotos de los equipos devueltos
                      <input
                        className="mt-2 block w-full text-sm"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        onChange={(event) => void handleReturnPhotos(event.target.files)}
                      />
                    </label>
                    {returnPhotos.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {returnPhotos.map((photo, index) => (
                          <div key={`${photo.name}-${index}`} className="overflow-hidden rounded-md border bg-white">
                            <img className="h-20 w-full object-cover" src={photo.dataUrl} alt={photo.name} />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="grid gap-3">
                      <SignaturePad
                        label="Firma coordinacion"
                        value={returnSignatures.coordinador}
                        onChange={(value) =>
                          setReturnSignatures((current) => ({ ...current, coordinador: value }))
                        }
                      />
                      <SignaturePad
                        label="Firma administrador del sistema"
                        value={returnSignatures.admin}
                        onChange={(value) =>
                          setReturnSignatures((current) => ({ ...current, admin: value }))
                        }
                      />
                      <SignaturePad
                        label="Firma solicitante"
                        value={returnSignatures.solicitante}
                        onChange={(value) =>
                          setReturnSignatures((current) => ({ ...current, solicitante: value }))
                        }
                      />
                    </div>
                  </div>
                )}

                {lastReturnActId && (
                  <a
                    className="block rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-center text-sm font-medium text-primary"
                    href={`/returns/${lastReturnActId}/acta`}
                  >
                    Visualizar acta de devolucion #{lastReturnActId}
                  </a>
                )}

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
                  <div className="space-y-4 rounded-md border bg-muted/20 p-3">
                    <div>
                      <h3 className="text-sm font-semibold">Acta de entrega</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Toma fotos de los equipos y registra las firmas digitales para entregar.
                      </p>
                    </div>
                    <label className="block text-sm font-medium">
                      Fotos de los equipos entregados
                      <span className="mt-2 flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm text-muted-foreground">
                        <Camera className="h-4 w-4 text-primary" />
                        Camara o galeria
                      </span>
                      <input
                        className="sr-only"
                        type="file"
                        accept="image/*"
                        capture="environment"
                        multiple
                        onChange={(event) => void handleDeliveryPhotos(event.target.files)}
                      />
                    </label>
                    {deliveryPhotos.length > 0 && (
                      <div className="grid grid-cols-3 gap-2">
                        {deliveryPhotos.map((photo, index) => (
                          <div key={`${photo.name}-${index}`} className="overflow-hidden rounded-md border bg-white">
                            <img className="h-20 w-full object-cover" src={photo.dataUrl} alt={photo.name} />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="grid gap-3">
                      <SignaturePad
                        label="Firma coordinacion"
                        value={deliverySignatures.coordinador}
                        onChange={(value) =>
                          setDeliverySignatures((current) => ({ ...current, coordinador: value }))
                        }
                      />
                      <SignaturePad
                        label="Firma solicitante"
                        value={deliverySignatures.solicitante}
                        onChange={(value) =>
                          setDeliverySignatures((current) => ({ ...current, solicitante: value }))
                        }
                      />
                    </div>
                    <Button
                      className="w-full"
                      type="button"
                      onClick={() => handleDeliver(selectedLoan)}
                      disabled={pendingAction}
                    >
                      <PackageCheck className="h-4 w-4" />
                      Registrar entrega y generar acta
                    </Button>
                  </div>
                )}

                {(lastDeliveryActLoanId === selectedLoan.id || selectedLoan.evidencias.length > 0) && (
                  <a
                    className="block rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-center text-sm font-medium text-primary"
                    href={`/loans/${selectedLoan.id}/acta-entrega`}
                  >
                    Visualizar acta de entrega {selectedLoan.codigo}
                  </a>
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

      {publicApprovalRequest && publicApprovalForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-md border bg-white shadow-xl">
            <div className="flex items-start justify-between gap-4 border-b p-4">
              <div>
                <h2 className="text-lg font-semibold">Aprobar solicitud publica</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {publicApprovalRequest.nombreCompleto} - {publicApprovalRequest.codigoSolicitud}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setPublicApprovalRequest(null);
                  setPublicApprovalForm(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4 p-4">
              <div className="rounded-md border bg-muted/20 p-3 text-sm">
                <p className="font-medium">{publicApprovalRequest.codigoRecurso}</p>
                <p className="mt-1 text-muted-foreground">
                  {publicApprovalRequest.descripcionActividad}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Fecha de prestamo">
                  <input
                    className="input-control"
                    type="datetime-local"
                    value={publicApprovalForm.fechaPrestamo}
                    onChange={(event) => updatePublicApprovalForm("fechaPrestamo", event.target.value)}
                    required
                  />
                </Field>
                <Field label="Devolucion estimada">
                  <input
                    className="input-control"
                    type="datetime-local"
                    min={publicApprovalForm.fechaPrestamo}
                    value={publicApprovalForm.fechaDevolucionEstimada}
                    onChange={(event) =>
                      updatePublicApprovalForm("fechaDevolucionEstimada", event.target.value)
                    }
                    required
                  />
                </Field>
              </div>

              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                Duracion estimada:{" "}
                <span className="font-semibold text-foreground">
                  {calculateLoanDays(
                    publicApprovalForm.fechaPrestamo,
                    publicApprovalForm.fechaDevolucionEstimada
                  )}{" "}
                  dias
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Equipo real a prestar">
                  <SearchableSelect
                    options={equipmentOptions}
                    value={publicApprovalForm.equipoId}
                    onChange={(value) => updatePublicApprovalForm("equipoId", value)}
                    placeholder="Seleccionar equipo"
                    searchPlaceholder="Buscar por nombre, codigo o categoria"
                    emptyLabel="Seleccionar"
                    required
                  />
                </Field>
                {approvalSelectedEquipment?.requiereSerial ? (
                  <Field label="Unidad">
                    <SearchableSelect
                      options={approvalUnitOptions}
                      value={publicApprovalForm.equipoUnidadId}
                      onChange={(value) => updatePublicApprovalForm("equipoUnidadId", value)}
                      placeholder="Seleccionar unidad"
                      searchPlaceholder="Buscar por codigo o serial"
                      emptyLabel="Seleccionar"
                      required
                    />
                  </Field>
                ) : (
                  <Field label="Cantidad aprobada">
                    <input
                      className="input-control"
                      type="number"
                      min="1"
                      max={approvalSelectedEquipment?.cantidadDisponible}
                      value={publicApprovalForm.cantidadAprobada}
                      onChange={(event) =>
                        updatePublicApprovalForm("cantidadAprobada", event.target.value)
                      }
                      required
                    />
                  </Field>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Uso">
                  <SearchableSelect
                    options={useTypeOptions}
                    value={publicApprovalForm.tipoUso}
                    onChange={(value) => updatePublicApprovalForm("tipoUso", value as TipoUso)}
                    placeholder="Seleccionar uso"
                    searchPlaceholder="Buscar uso"
                    emptyLabel="Seleccionar"
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Materia">
                  <SearchableSelect
                    options={subjectOptions}
                    value={publicApprovalForm.materiaId}
                    onChange={(value) => updatePublicApprovalForm("materiaId", value)}
                    placeholder="Seleccionar materia"
                    searchPlaceholder="Buscar materia"
                    emptyLabel="Sin materia"
                    required={publicApprovalForm.tipoUso === "ACADEMICO"}
                  />
                </Field>
                <Field label="Profesor / grupo">
                  <SearchableSelect
                    options={approvalSubjectProfessorOptions}
                    value={publicApprovalForm.materiaProfesorId}
                    onChange={(value) => updatePublicApprovalForm("materiaProfesorId", value)}
                    placeholder="Seleccionar grupo"
                    searchPlaceholder="Buscar profesor o grupo"
                    emptyLabel="Sin grupo"
                    disabled={!publicApprovalForm.materiaId}
                  />
                </Field>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Proyecto">
                  <SearchableSelect
                    options={projectOptions}
                    value={publicApprovalForm.proyectoId}
                    onChange={(value) => updatePublicApprovalForm("proyectoId", value)}
                    placeholder="Seleccionar proyecto"
                    searchPlaceholder="Buscar proyecto"
                    emptyLabel="Sin proyecto"
                  />
                </Field>
                <Field label="Actividad">
                  <SearchableSelect
                    options={activityOptions}
                    value={publicApprovalForm.actividadId}
                    onChange={(value) => updatePublicApprovalForm("actividadId", value)}
                    placeholder="Seleccionar actividad"
                    searchPlaceholder="Buscar actividad"
                    emptyLabel="Sin actividad"
                  />
                </Field>
              </div>

              <Field label="Observaciones internas">
                <textarea
                  className="textarea-control"
                  value={publicApprovalForm.observacionesInternas}
                  onChange={(event) =>
                    updatePublicApprovalForm("observacionesInternas", event.target.value)
                  }
                />
              </Field>
            </div>
            <div className="flex flex-col gap-2 border-t p-4 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPublicApprovalRequest(null);
                  setPublicApprovalForm(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="button" disabled={pendingAction} onClick={handleApprovePublicRequest}>
                {publicRequestMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Aprobar y crear prestamo
              </Button>
            </div>
          </div>
        </div>
      )}
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

function SignaturePad({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);

  function getPoint(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }

  function startDrawing(event: PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }
    drawingRef.current = true;
    canvas.setPointerCapture(event.pointerId);
    const point = getPoint(event);
    context.strokeStyle = "#10201a";
    context.lineWidth = 2;
    context.lineCap = "round";
    context.beginPath();
    context.moveTo(point.x, point.y);
  }

  function draw(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) {
      return;
    }
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }
    const point = getPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
    onChange(canvas.toDataURL("image/png"));
  }

  function stopDrawing() {
    drawingRef.current = false;
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }
    context.clearRect(0, 0, canvas.width, canvas.height);
    onChange("");
  }

  return (
    <div className="rounded-md border bg-white p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <Button size="sm" type="button" variant="ghost" onClick={clearSignature}>
          Limpiar
        </Button>
      </div>
      <canvas
        ref={canvasRef}
        className="h-28 w-full touch-none rounded-md border bg-white"
        height={112}
        width={360}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
        onPointerCancel={stopDrawing}
      />
      <p className="mt-1 text-xs text-muted-foreground">
        {value ? "Firma capturada." : "Firma dentro del recuadro."}
      </p>
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

function getPublicRequestBadgeClass(state: EstadoSolicitudPublicaPrestamo) {
  if (state === "RECIBIDA") {
    return "badge badge-gray";
  }
  if (state === "EN_REVISION") {
    return "badge badge-amber";
  }
  if (state === "CONVERTIDA") {
    return "badge badge-green";
  }
  return "badge badge-red";
}

function publicApplicantContext(request: PublicLoanRequest) {
  if (request.rolSolicitante === "ESTUDIANTE") {
    return [
      request.programa ? `Programa: ${request.programa}` : "Programa sin registrar",
      request.semestre ? `Semestre: ${request.semestre}` : "Semestre sin registrar"
    ].join(" | ");
  }
  if (request.rolSolicitante === "PROFESOR") {
    return request.materia ? `Materia: ${request.materia}` : "Materia sin registrar";
  }
  return request.dependencia ? `Dependencia: ${request.dependencia}` : "Dependencia sin registrar";
}

function getLoanRequesterName(loan: Loan) {
  return loan.personaSolicitante?.nombre ?? loan.usuarioSolicitante?.nombre ?? loan.solicitanteNombre ?? "Solicitante";
}

function getLoanRequesterEmail(loan: Loan) {
  return (
    loan.personaSolicitante?.correoInstitucional ??
    loan.usuarioSolicitante?.correo ??
    loan.solicitanteCorreo ??
    "Sin correo"
  );
}

function getLoanAcademicContext(loan: Loan) {
  const parts = [
    loan.materia ? `${loan.materia.codigo} - ${loan.materia.nombre}` : "",
    loan.materiaProfesor
      ? `${loan.materiaProfesor.profesor.nombre} / ${loan.materiaProfesor.grupo}`
      : "",
    loan.proyecto ? `Proyecto: ${loan.proyecto.nombre}` : "",
    loan.actividad ? `Actividad: ${loan.actividad.nombre}` : ""
  ].filter(Boolean);

  return parts.length ? parts.join(" | ") : "Sin contexto academico";
}

function canReturn(state: EstadoPrestamo) {
  return state === "ENTREGADO" || state === "DEVUELTO_PARCIAL" || state === "VENCIDO";
}

function calculateLoanDays(startValue: string, endValue: string) {
  const start = new Date(startValue);
  const end = new Date(endValue);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return 0;
  }
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
}

function personAffiliationLabel(role: RolPersonaPrestamo) {
  if (role === "PROFESOR") return "Facultad";
  if (role === "ADMINISTRATIVO") return "Dependencia";
  return "Programa / carrera";
}

function toDatetimeLocal(date: Date) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Solo se permiten imagenes."));
      return;
    }
    if (file.size > 2_500_000) {
      reject(new Error("Cada foto debe pesar menos de 2.5 MB."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No fue posible leer la imagen."));
    reader.readAsDataURL(file);
  });
}
