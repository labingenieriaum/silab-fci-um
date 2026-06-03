import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { getUserFacultyScope, resolveFacultyForWrite } from "../common/faculty-scope";
import type { JwtUser } from "../common/types/jwt-user";
import { PrismaService } from "../prisma/prisma.service";
import { CreateFacultyDto } from "./dto/create-faculty.dto";
import { UpdateFacultyDto } from "./dto/update-faculty.dto";

const facultySelect = {
  id: true,
  nombre: true,
  sigla: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      programas: true,
      laboratorios: true,
      usuarios: true
    }
  }
} satisfies Prisma.FacultadSelect;

@Injectable()
export class AcademicService {
  constructor(private readonly prisma: PrismaService) {}

  findFaculties(user: JwtUser) {
    const scopedFacultyId = getUserFacultyScope(user);

    return this.prisma.facultad.findMany({
      where: {
        id: scopedFacultyId,
        deletedAt: null
      },
      orderBy: { nombre: "asc" },
      select: facultySelect
    });
  }

  async createFaculty(user: JwtUser, dto: CreateFacultyDto) {
    this.ensureGlobalFacultyManagement(user);

    try {
      return await this.prisma.facultad.create({
        data: {
          nombre: dto.nombre.trim(),
          sigla: dto.sigla.trim().toUpperCase()
        },
        select: facultySelect
      });
    } catch (error) {
      handleKnownDatabaseError(error, "Ya existe una facultad con esa sigla.");
    }
  }

  async updateFaculty(user: JwtUser, id: number, dto: UpdateFacultyDto) {
    this.ensureGlobalFacultyManagement(user);
    await this.findFacultyOrThrow(id);

    try {
      return await this.prisma.facultad.update({
        where: { id },
        data: {
          nombre: dto.nombre?.trim(),
          sigla: dto.sigla?.trim().toUpperCase()
        },
        select: facultySelect
      });
    } catch (error) {
      handleKnownDatabaseError(error, "Ya existe una facultad con esa sigla.");
    }
  }

  async removeFaculty(user: JwtUser, id: number) {
    this.ensureGlobalFacultyManagement(user);
    const faculty = await this.findFacultyOrThrow(id);

    if (
      faculty._count.programas > 0 ||
      faculty._count.laboratorios > 0 ||
      faculty._count.usuarios > 0
    ) {
      throw new BadRequestException(
        "No se puede eliminar una facultad con programas, laboratorios o usuarios asociados."
      );
    }

    return this.prisma.facultad.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: facultySelect
    });
  }

  findPrograms(user: JwtUser, facultadId?: number) {
    const scopedFacultyId = resolveFacultyForWrite(user, facultadId);

    return this.prisma.programa.findMany({
      where: {
        deletedAt: null,
        facultadId: scopedFacultyId
      },
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        facultadId: true,
        nombre: true,
        codigo: true
      }
    });
  }

  private async findFacultyOrThrow(id: number) {
    const faculty = await this.prisma.facultad.findFirst({
      where: { id, deletedAt: null },
      select: facultySelect
    });

    if (!faculty) {
      throw new NotFoundException("Facultad no encontrada.");
    }

    return faculty;
  }

  private ensureGlobalFacultyManagement(user: JwtUser) {
    const scopedFacultyId = getUserFacultyScope(user);
    if (scopedFacultyId) {
      throw new ForbiddenException(
        "Solo un administrador global puede crear o eliminar facultades."
      );
    }
  }
}

function handleKnownDatabaseError(error: unknown, uniqueMessage: string): never {
  if (isPrismaError(error, "P2002")) {
    throw new ConflictException(uniqueMessage);
  }
  throw error;
}

function isPrismaError(error: unknown, code: string) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === code
  );
}
