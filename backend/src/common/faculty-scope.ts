import { ForbiddenException } from "@nestjs/common";
import { TipoUsuario } from "@prisma/client";
import type { JwtUser } from "./types/jwt-user";

export function getUserFacultyScope(user: JwtUser) {
  if (user.tipoUsuario === TipoUsuario.ADMINISTRADOR && !user.facultadId) {
    return undefined;
  }

  if (!user.facultadId) {
    throw new ForbiddenException("El usuario no tiene una facultad asignada.");
  }

  return user.facultadId;
}

export function resolveFacultyForWrite(user: JwtUser, requestedFacultyId?: number | null) {
  const scopedFacultyId = getUserFacultyScope(user);

  if (!scopedFacultyId) {
    return requestedFacultyId ?? undefined;
  }

  if (requestedFacultyId && requestedFacultyId !== scopedFacultyId) {
    throw new ForbiddenException("No puedes operar sobre una facultad diferente a la asignada.");
  }

  return scopedFacultyId;
}

export function assertFacultyAccess(user: JwtUser, facultyId?: number | null) {
  const scopedFacultyId = getUserFacultyScope(user);

  if (scopedFacultyId && facultyId !== scopedFacultyId) {
    throw new ForbiddenException("No tienes acceso a recursos de esa facultad.");
  }
}
