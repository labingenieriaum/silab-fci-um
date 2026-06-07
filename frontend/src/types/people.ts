import type { PaginatedResponse } from "@/types/inventory";

export type RolPersonaPrestamo = "ESTUDIANTE" | "PROFESOR" | "ADMINISTRATIVO";

export interface LoanPerson {
  id: number;
  codigo: string;
  nombre: string;
  correoInstitucional: string | null;
  carrera: string | null;
  semestre: number | null;
  rol: RolPersonaPrestamo;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PeopleSummary {
  estudiantes: number;
  profesores: number;
  administrativos: number;
}

export interface PaginatedPeople extends PaginatedResponse<LoanPerson> {
  summary: PeopleSummary;
}

export interface PersonPayload {
  codigo: string;
  nombre: string;
  correoInstitucional?: string | null;
  carrera?: string | null;
  semestre?: number | null;
  rol: RolPersonaPrestamo;
  activo?: boolean;
}
