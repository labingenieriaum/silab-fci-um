import type { TipoUsuario } from "@prisma/client";

export interface AuthUserResponse {
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
  user: AuthUserResponse;
}

