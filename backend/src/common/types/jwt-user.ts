import type { TipoUsuario } from "@prisma/client";

export interface JwtUser {
  sub: number;
  correo: string;
  nombre: string;
  rolId: number;
  rol: string;
  tipoUsuario: TipoUsuario;
  facultadId?: number | null;
  programaId?: number | null;
  permissions: string[];
}

