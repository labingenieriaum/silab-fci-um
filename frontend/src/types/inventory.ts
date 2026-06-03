import type { Facultad } from "@/types/catalogs";

export type EstadoEquipo =
  | "DISPONIBLE"
  | "PRESTADO"
  | "EN_MANTENIMIENTO"
  | "DANADO"
  | "BAJA"
  | "PERDIDO"
  | "INACTIVO";

export type TipoUbicacion =
  | "EDIFICIO"
  | "PISO"
  | "LABORATORIO"
  | "SALA"
  | "ALMACEN"
  | "ESTANTE"
  | "GABINETE"
  | "OTRO";

export type TipoMovimiento =
  | "ENTRADA"
  | "AJUSTE_POSITIVO"
  | "AJUSTE_NEGATIVO"
  | "PRESTAMO"
  | "DEVOLUCION"
  | "TRASLADO"
  | "MANTENIMIENTO_ENTRADA"
  | "MANTENIMIENTO_SALIDA"
  | "BAJA";

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface EquipmentCategory {
  id: number;
  nombre: string;
  descripcion: string | null;
  _count: {
    equipos: number;
  };
}

export interface Laboratory {
  id: number;
  facultadId: number;
  responsableId: number | null;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  facultad: Facultad;
  responsable: {
    id: number;
    nombre: string;
    correo: string;
  } | null;
  _count: {
    ubicaciones: number;
  };
}

export interface Location {
  id: number;
  laboratorioId: number;
  ubicacionPadreId: number | null;
  nombre: string;
  tipo: TipoUbicacion;
  descripcion: string | null;
  activa: boolean;
  laboratorio: {
    id: number;
    nombre: string;
    codigo: string;
  };
  ubicacionPadre: {
    id: number;
    nombre: string;
    tipo: TipoUbicacion;
  } | null;
  _count: {
    sububicaciones: number;
    equipos: number;
    unidades: number;
  };
}

export interface Equipment {
  id: number;
  categoriaId: number;
  ubicacionId: number;
  responsableId: number | null;
  codigoInterno: string;
  nombre: string;
  marca: string | null;
  modelo: string | null;
  requiereSerial: boolean;
  cantidadTotal: number;
  cantidadDisponible: number;
  cantidadPrestada: number;
  cantidadMantenimiento: number;
  cantidadBaja: number;
  estado: EstadoEquipo;
  valorEstimado: string;
  observaciones: string | null;
  categoria: {
    id: number;
    nombre: string;
  };
  ubicacion: {
    id: number;
    nombre: string;
    tipo: TipoUbicacion;
    laboratorio: {
      id: number;
      nombre: string;
      codigo: string;
    };
  };
  responsable: {
    id: number;
    nombre: string;
    correo: string;
  } | null;
  _count: {
    unidades: number;
    movimientos: number;
    prestamoDetalles: number;
    mantenimientos: number;
    archivos: number;
  };
}

export interface EquipmentUnit {
  id: number;
  equipoId: number;
  ubicacionId: number | null;
  codigoInterno: string;
  serial: string | null;
  estado: EstadoEquipo;
  observaciones: string | null;
  equipo: {
    id: number;
    codigoInterno: string;
    nombre: string;
  };
  ubicacion: {
    id: number;
    nombre: string;
    tipo: TipoUbicacion;
    laboratorio: {
      id: number;
      nombre: string;
      codigo: string;
    };
  } | null;
}

export interface InventoryMovement {
  id: number;
  equipoId: number;
  equipoUnidadId: number | null;
  usuarioId: number;
  ubicacionOrigenId: number | null;
  ubicacionDestinoId: number | null;
  tipoMovimiento: TipoMovimiento;
  cantidad: number;
  cantidadAnterior: number | null;
  cantidadNueva: number | null;
  descripcion: string | null;
  fecha: string;
  equipo: {
    id: number;
    codigoInterno: string;
    nombre: string;
  };
  equipoUnidad: {
    id: number;
    codigoInterno: string;
    serial: string | null;
    estado: EstadoEquipo;
  } | null;
  usuario: {
    id: number;
    nombre: string;
    correo: string;
  };
  ubicacionOrigen: {
    id: number;
    nombre: string;
  } | null;
  ubicacionDestino: {
    id: number;
    nombre: string;
  } | null;
}
