export interface Role {
  id: number;
  nombre: string;
  descripcion: string | null;
  permisos?: Array<{
    permiso: {
      id: number;
      codigo: string;
      descripcion: string | null;
    };
  }>;
}

export interface Facultad {
  id: number;
  nombre: string;
  sigla: string;
  _count?: {
    programas: number;
    laboratorios: number;
    usuarios: number;
  };
}

export interface Programa {
  id: number;
  facultadId: number;
  nombre: string;
  codigo: string;
}
