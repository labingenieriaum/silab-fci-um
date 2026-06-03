import type { AuthUser, TipoUsuario } from "@/types/auth";

export interface UserListItem extends Omit<AuthUser, "permissions"> {
  rolId: number;
  facultadId: number | null;
  programaId: number | null;
  ultimoAcceso: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedUsers {
  data: UserListItem[];
  page: number;
  pageSize: number;
  total: number;
}

export interface CreateUserPayload {
  rolId: number;
  facultadId?: number;
  programaId?: number;
  nombre: string;
  correo: string;
  documento: string;
  password: string;
  tipoUsuario: TipoUsuario;
  activo?: boolean;
}

