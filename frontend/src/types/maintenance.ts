import type { Equipment, EquipmentUnit, PaginatedResponse } from "@/types/inventory";

export type TipoMantenimiento = "PREVENTIVO" | "CORRECTIVO" | "CALIBRACION" | "REVISION" | "OTRO";

export type EstadoMantenimiento = "ABIERTO" | "EN_PROCESO" | "FINALIZADO" | "CANCELADO";

export type EstadoCondicionEquipo =
  | "BUENO"
  | "REGULAR"
  | "DANADO"
  | "INCOMPLETO"
  | "PERDIDO"
  | "NO_APLICA";

export interface MaintenanceRecord {
  id: number;
  equipoId: number;
  equipoUnidadId: number | null;
  responsableId: number;
  tipoMantenimiento: TipoMantenimiento;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string | null;
  costo: string;
  estado: EstadoMantenimiento;
  observaciones: string | null;
  equipo: Pick<
    Equipment,
    | "id"
    | "codigoInterno"
    | "nombre"
    | "requiereSerial"
    | "estado"
    | "cantidadDisponible"
    | "cantidadPrestada"
    | "cantidadMantenimiento"
    | "cantidadBaja"
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
  responsable: {
    id: number;
    nombre: string;
    correo: string;
  };
}

export type PaginatedMaintenance = PaginatedResponse<MaintenanceRecord>;
