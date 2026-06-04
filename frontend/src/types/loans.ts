import type { Equipment, EquipmentUnit, PaginatedResponse } from "@/types/inventory";

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

export interface Loan {
  id: number;
  codigo: string;
  usuarioSolicitanteId: number;
  tipoUso: TipoUso;
  fechaSolicitud: string;
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
  };
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
}

export type PaginatedLoans = PaginatedResponse<Loan>;
