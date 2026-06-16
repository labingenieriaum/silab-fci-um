export type TipoUsuario =
  | "ADMINISTRADOR"
  | "COORDINACION_LABORATORIOS"
  | "PRACTICANTE"
  | "DECANO"
  | "DIRECTOR_PROGRAMA"
  | "PROFESOR"
  | "ESTUDIANTE"
  | "MONITOR";

export interface AuthUser {
  id: number;
  nombre: string;
  correo: string;
  documento: string;
  tipoUsuario: TipoUsuario;
  activo: boolean;
  rol: {
    id: number;
    nombre: string;
    descripcion: string | null;
  };
  facultad: {
    id: number;
    nombre: string;
    sigla: string;
  } | null;
  programa: {
    id: number;
    nombre: string;
    codigo: string;
  } | null;
  permissions: string[];
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

