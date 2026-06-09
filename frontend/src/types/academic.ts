import type { Facultad, Programa } from "@/types/catalogs";
import type { PaginatedResponse } from "@/types/inventory";

export type TipoProyecto =
  | "AULA"
  | "INVESTIGACION"
  | "EXTENSION"
  | "SEMILLERO"
  | "GRADO"
  | "ADMINISTRATIVO"
  | "OTRO";
export type TipoActividad =
  | "CLASE"
  | "PRACTICA"
  | "INVESTIGACION"
  | "EXTENSION"
  | "CAPACITACION"
  | "EVENTO"
  | "OTRO";
export type TipoUsuarioAcademico =
  | "ADMINISTRADOR"
  | "COORDINACION_LABORATORIOS"
  | "DECANO"
  | "DIRECTOR_PROGRAMA"
  | "PROFESOR"
  | "ESTUDIANTE"
  | "MONITOR";

export interface AcademicUser {
  id: number;
  nombre: string;
  correo: string;
  tipoUsuario: TipoUsuarioAcademico;
  facultadId: number | null;
  programaId: number | null;
}

export interface SubjectProfessor {
  id: number;
  materiaId: number;
  profesorId: number;
  grupo: string;
  periodo: string | null;
  activo: boolean;
  profesor: Pick<AcademicUser, "id" | "nombre" | "correo" | "tipoUsuario">;
}

export interface Subject {
  id: number;
  programaId: number;
  nombre: string;
  codigo: string;
  semestre: number | null;
  activa: boolean;
  programa: Programa & {
    facultad: Facultad;
  };
  profesores: SubjectProfessor[];
  _count: {
    prestamos: number;
  };
}

export interface Seedbed {
  id: number;
  facultadId: number;
  coordinadorId: number;
  nombre: string;
  codigo: string;
  descripcion: string | null;
  activo: boolean;
  facultad: Facultad;
  coordinador: Pick<AcademicUser, "id" | "nombre" | "correo">;
  _count: {
    proyectos: number;
    actividades: number;
  };
}

export interface Project {
  id: number;
  programaId: number;
  responsableId: number;
  semilleroId: number | null;
  nombre: string;
  tipo: TipoProyecto;
  semilleroInvestigacion: string | null;
  descripcion: string | null;
  activo: boolean;
  programa: Programa & {
    facultad: Facultad;
  };
  responsable: Pick<AcademicUser, "id" | "nombre" | "correo">;
  semillero: Pick<Seedbed, "id" | "nombre" | "codigo"> | null;
  _count: {
    prestamos: number;
  };
}

export interface ActivityRecord {
  id: number;
  facultadId: number;
  programaId: number | null;
  responsableId: number | null;
  semilleroId: number | null;
  nombre: string;
  tipo: TipoActividad;
  descripcion: string | null;
  activa: boolean;
  facultad: Facultad;
  programa: Pick<Programa, "id" | "nombre" | "codigo"> | null;
  responsable: Pick<AcademicUser, "id" | "nombre" | "correo"> | null;
  semillero: Pick<Seedbed, "id" | "nombre" | "codigo"> | null;
  _count: {
    prestamos: number;
  };
}

export type PaginatedSubjects = PaginatedResponse<Subject>;
export type PaginatedSeedbeds = PaginatedResponse<Seedbed>;
export type PaginatedProjects = PaginatedResponse<Project>;
export type PaginatedActivities = PaginatedResponse<ActivityRecord>;
