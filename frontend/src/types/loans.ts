import type { Equipment, EquipmentUnit, PaginatedResponse } from "@/types/inventory";
import type { LoanPerson } from "@/types/people";
import type { ActivityRecord, Project, Subject, SubjectProfessor } from "@/types/academic";

export type EstadoPrestamo =
  | "SOLICITADO"
  | "APROBADO"
  | "RECHAZADO"
  | "ENTREGADO"
  | "DEVUELTO_PARCIAL"
  | "DEVUELTO"
  | "VENCIDO"
  | "CANCELADO";

export type EstadoCondicionEquipo =
  | "BUENO"
  | "REGULAR"
  | "DANADO"
  | "INCOMPLETO"
  | "PERDIDO"
  | "NO_APLICA";

export type TipoUso =
  | "ACADEMICO"
  | "INVESTIGACION"
  | "EXTENSION"
  | "ADMINISTRATIVO"
  | "PROYECTO"
  | "OTRO";

export type TipoEvidenciaPrestamo = "FOTO" | "FIRMA_COORDINADOR" | "FIRMA_SOLICITANTE";

export interface LoanDetail {
  id: number;
  prestamoId: number;
  equipoId: number;
  equipoUnidadId: number | null;
  cantidadSolicitada: number;
  cantidadAprobada: number | null;
  cantidadEntregada: number;
  cantidadDevuelta: number;
  estadoEntrega: EstadoCondicionEquipo | null;
  estadoDevolucion: EstadoCondicionEquipo | null;
  observaciones: string | null;
  equipo: Pick<
    Equipment,
    "id" | "codigoInterno" | "nombre" | "requiereSerial" | "cantidadDisponible" | "cantidadPrestada"
  > & {
    ubicacion: {
      id: number;
      nombre: string;
      laboratorio: {
        id: number;
        nombre: string;
        codigo: string;
        facultadId: number;
      };
    };
  };
  equipoUnidad: Pick<EquipmentUnit, "id" | "codigoInterno" | "serial" | "estado" | "ubicacionId"> | null;
}

export interface LoanReturn {
  id: number;
  prestamoId: number;
  usuarioRecibeId: number;
  fechaDevolucion: string;
  observaciones: string | null;
  usuarioRecibe: {
    id: number;
    nombre: string;
    correo: string;
  };
  detalles: {
    id: number;
    prestamoDetalleId: number;
    equipoId: number;
    equipoUnidadId: number | null;
    cantidad: number;
    estadoDevolucion: EstadoCondicionEquipo;
    observaciones: string | null;
  }[];
}

export interface LoanEvidence {
  id: number;
  prestamoId: number;
  tipo: TipoEvidenciaPrestamo;
  nombreArchivo: string | null;
  mimeType: string;
  contenidoBase64: string;
  firmanteNombre: string | null;
  createdAt: string;
}

export interface Loan {
  id: number;
  codigo: string;
  usuarioSolicitanteId: number | null;
  personaSolicitanteId: number | null;
  materiaId: number | null;
  materiaProfesorId: number | null;
  proyectoId: number | null;
  actividadId: number | null;
  solicitanteNombre: string | null;
  solicitanteCorreo: string | null;
  solicitanteDocumento: string | null;
  tipoUso: TipoUso;
  fechaSolicitud: string;
  fechaRequerida: string | null;
  fechaPrestamo: string | null;
  fechaAprobacion: string | null;
  fechaRechazo: string | null;
  fechaEntrega: string | null;
  fechaDevolucionEstimada: string;
  fechaDevolucionReal: string | null;
  estado: EstadoPrestamo;
  observaciones: string | null;
  motivoRechazo: string | null;
  usuarioSolicitante: {
    id: number;
    nombre: string;
    correo: string;
    documento: string;
  } | null;
  personaSolicitante: LoanPerson | null;
  materia: Pick<Subject, "id" | "codigo" | "nombre" | "semestre"> & {
    programa: {
      id: number;
      nombre: string;
      codigo: string;
    };
  } | null;
  materiaProfesor: Pick<SubjectProfessor, "id" | "grupo" | "periodo"> & {
    profesor: {
      id: number;
      nombre: string;
      correo: string;
    };
  } | null;
  proyecto: Pick<Project, "id" | "nombre" | "tipo"> & {
    semillero: {
      id: number;
      nombre: string;
      codigo: string;
    } | null;
  } | null;
  actividad: Pick<ActivityRecord, "id" | "nombre" | "tipo"> & {
    semillero: {
      id: number;
      nombre: string;
      codigo: string;
    } | null;
  } | null;
  aprobadoPor: {
    id: number;
    nombre: string;
    correo: string;
  } | null;
  rechazadoPor: {
    id: number;
    nombre: string;
    correo: string;
  } | null;
  entregadoPor: {
    id: number;
    nombre: string;
    correo: string;
  } | null;
  detalles: LoanDetail[];
  devoluciones: LoanReturn[];
  evidencias: LoanEvidence[];
}

export type PaginatedLoans = PaginatedResponse<Loan>;
