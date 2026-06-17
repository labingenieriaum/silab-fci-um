import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { TipoUbicacion, type Prisma } from "@prisma/client";
import { assertFacultyAccess, getUserFacultyScope, resolveFacultyForWrite } from "../common/faculty-scope";
import type { JwtUser } from "../common/types/jwt-user";
import { PrismaService } from "../prisma/prisma.service";
import { CreateLaboratoryDto } from "./dto/create-laboratory.dto";
import { CreateLocationDto } from "./dto/create-location.dto";
import { ListLaboratoriesQueryDto } from "./dto/list-laboratories-query.dto";
import { ListLocationsQueryDto } from "./dto/list-locations-query.dto";
import { UpdateLaboratoryDto } from "./dto/update-laboratory.dto";
import { UpdateLocationDto } from "./dto/update-location.dto";

const laboratorySelect = {
  id: true,
  facultadId: true,
  responsableId: true,
  nombre: true,
  codigo: true,
  descripcion: true,
  createdAt: true,
  updatedAt: true,
  facultad: {
    select: {
      id: true,
      nombre: true,
      sigla: true
    }
  },
  responsable: {
    select: {
      id: true,
      nombre: true,
      correo: true
    }
  },
  _count: {
    select: {
      ubicaciones: true
    }
  }
} satisfies Prisma.LaboratorioSelect;

const locationSelect = {
  id: true,
  laboratorioId: true,
  ubicacionPadreId: true,
  nombre: true,
  tipo: true,
  descripcion: true,
  activa: true,
  createdAt: true,
  updatedAt: true,
  laboratorio: {
    select: {
      id: true,
      nombre: true,
      codigo: true
    }
  },
  ubicacionPadre: {
    select: {
      id: true,
      nombre: true,
      tipo: true
    }
  },
  _count: {
    select: {
      sububicaciones: true,
      equipos: true,
      unidades: true
    }
  }
} satisfies Prisma.UbicacionSelect;

@Injectable()
export class LaboratoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findLaboratories(user: JwtUser, query: ListLaboratoriesQueryDto) {
    const scopedFacultyId = resolveFacultyForWrite(user, query.facultadId);
    const where: Prisma.LaboratorioWhereInput = {
      deletedAt: null,
      facultadId: scopedFacultyId,
      responsableId: query.responsableId,
      OR: query.search
        ? [
            { nombre: { contains: query.search, mode: "insensitive" } },
            { codigo: { contains: query.search, mode: "insensitive" } }
          ]
        : undefined
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.laboratorio.findMany({
        where,
        select: laboratorySelect,
        orderBy: [{ nombre: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      }),
      this.prisma.laboratorio.count({ where })
    ]);

    return {
      data,
      page: query.page,
      pageSize: query.pageSize,
      total
    };
  }

  async findLaboratory(user: JwtUser, id: number) {
    const scopedFacultyId = getUserFacultyScope(user);
    const laboratory = await this.prisma.laboratorio.findFirst({
      where: { id, facultadId: scopedFacultyId, deletedAt: null },
      select: laboratorySelect
    });

    if (!laboratory) {
      throw new NotFoundException("Laboratorio no encontrado.");
    }

    return laboratory;
  }

  async createLaboratory(user: JwtUser, dto: CreateLaboratoryDto) {
    const facultadId = resolveFacultyForWrite(user, dto.facultadId);

    if (!facultadId) {
      throw new BadRequestException("Selecciona una facultad para crear el laboratorio.");
    }

    try {
      return await this.prisma.laboratorio.create({
        data: {
          facultadId,
          responsableId: dto.responsableId ?? null,
          nombre: dto.nombre.trim(),
          codigo: dto.codigo.trim().toUpperCase(),
          descripcion: dto.descripcion?.trim() || null
        },
        select: laboratorySelect
      });
    } catch (error) {
      handleKnownDatabaseError(error, "Ya existe un laboratorio con ese codigo.");
    }
  }

  async updateLaboratory(user: JwtUser, id: number, dto: UpdateLaboratoryDto) {
    const current = await this.findLaboratory(user, id);
    const facultadId = resolveFacultyForWrite(
      user,
      dto.facultadId === undefined ? current.facultadId : dto.facultadId
    );

    try {
      return await this.prisma.laboratorio.update({
        where: { id },
        data: {
          facultadId: dto.facultadId === undefined ? undefined : facultadId,
          responsableId: dto.responsableId,
          nombre: dto.nombre?.trim(),
          codigo: dto.codigo?.trim().toUpperCase(),
          descripcion: dto.descripcion === undefined ? undefined : dto.descripcion?.trim() || null
        },
        select: laboratorySelect
      });
    } catch (error) {
      handleKnownDatabaseError(error, "Ya existe un laboratorio con ese codigo.");
    }
  }

  async removeLaboratory(user: JwtUser, id: number) {
    const laboratory = await this.findLaboratory(user, id);
    if (laboratory._count.ubicaciones > 0) {
      throw new BadRequestException("No se puede eliminar un laboratorio con ubicaciones registradas.");
    }

    return this.prisma.laboratorio.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: laboratorySelect
    });
  }

  async findLocations(user: JwtUser, query: ListLocationsQueryDto) {
    const scopedFacultyId = getUserFacultyScope(user);
    const where: Prisma.UbicacionWhereInput = {
      deletedAt: null,
      laboratorioId: query.laboratorioId,
      laboratorio: {
        facultadId: scopedFacultyId
      },
      ubicacionPadreId: query.ubicacionPadreId,
      tipo: query.tipo,
      activa: query.activa,
      OR: query.search
        ? [
            { nombre: { contains: query.search, mode: "insensitive" } },
            { descripcion: { contains: query.search, mode: "insensitive" } }
          ]
        : undefined
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.ubicacion.findMany({
        where,
        select: locationSelect,
        orderBy: [{ laboratorio: { nombre: "asc" } }, { nombre: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      }),
      this.prisma.ubicacion.count({ where })
    ]);

    return {
      data,
      page: query.page,
      pageSize: query.pageSize,
      total
    };
  }

  async findLocationTree(user: JwtUser, laboratorioId?: number) {
    const scopedFacultyId = getUserFacultyScope(user);
    const locations = await this.prisma.ubicacion.findMany({
      where: {
        deletedAt: null,
        laboratorioId,
        laboratorio: {
          facultadId: scopedFacultyId
        }
      },
      select: locationSelect,
      orderBy: [{ laboratorio: { nombre: "asc" } }, { nombre: "asc" }]
    });

    const byParent = new Map<number | null, Array<(typeof locations)[number]>>();
    for (const location of locations) {
      const parentId = location.ubicacionPadreId ?? null;
      byParent.set(parentId, [...(byParent.get(parentId) ?? []), location]);
    }

    const buildBranch = (parentId: number | null): unknown[] =>
      (byParent.get(parentId) ?? []).map((location) => ({
        ...location,
        children: buildBranch(location.id)
      }));

    return buildBranch(null);
  }

  async findLocation(user: JwtUser, id: number) {
    const scopedFacultyId = getUserFacultyScope(user);
    const location = await this.prisma.ubicacion.findFirst({
      where: {
        id,
        deletedAt: null,
        laboratorio: {
          facultadId: scopedFacultyId
        }
      },
      select: locationSelect
    });

    if (!location) {
      throw new NotFoundException("Ubicacion no encontrada.");
    }

    return location;
  }

  async createLocation(user: JwtUser, dto: CreateLocationDto) {
    await this.ensureLaboratoryInScope(user, dto.laboratorioId);
    await this.ensureValidLocationParent(dto.laboratorioId, dto.ubicacionPadreId);

    return this.prisma.ubicacion.create({
      data: {
        laboratorioId: dto.laboratorioId,
        ubicacionPadreId: dto.ubicacionPadreId ?? null,
        nombre: dto.nombre.trim(),
        tipo: dto.tipo,
        descripcion: dto.descripcion?.trim() || null,
        activa: dto.activa ?? true
      },
      select: locationSelect
    });
  }

  async findOrCreateLaboratoryRootLocation(user: JwtUser, laboratorioId: number) {
    const laboratory = await this.ensureLaboratoryInScope(user, laboratorioId);
    const existing = await this.prisma.ubicacion.findFirst({
      where: {
        laboratorioId,
        ubicacionPadreId: null,
        tipo: TipoUbicacion.LABORATORIO,
        deletedAt: null
      },
      select: locationSelect,
      orderBy: { id: "asc" }
    });

    if (existing) {
      return existing;
    }

    return this.prisma.ubicacion.create({
      data: {
        laboratorioId,
        ubicacionPadreId: null,
        nombre: laboratory.nombre,
        tipo: TipoUbicacion.LABORATORIO,
        descripcion: "Ubicacion raiz para equipos guardados directamente en el laboratorio.",
        activa: true
      },
      select: locationSelect
    });
  }

  async updateLocation(user: JwtUser, id: number, dto: UpdateLocationDto) {
    const current = await this.findLocation(user, id);
    const nextLaboratoryId = dto.laboratorioId ?? current.laboratorioId;
    const nextParentId =
      dto.ubicacionPadreId === undefined ? current.ubicacionPadreId : dto.ubicacionPadreId;

    if (nextParentId === id) {
      throw new BadRequestException("Una ubicacion no puede ser padre de si misma.");
    }

    await this.ensureLaboratoryInScope(user, nextLaboratoryId);
    await this.ensureValidLocationParent(nextLaboratoryId, nextParentId, id);

    return this.prisma.ubicacion.update({
      where: { id },
      data: {
        laboratorioId: dto.laboratorioId,
        ubicacionPadreId: dto.ubicacionPadreId,
        nombre: dto.nombre?.trim(),
        tipo: dto.tipo,
        descripcion: dto.descripcion === undefined ? undefined : dto.descripcion?.trim() || null,
        activa: dto.activa
      },
      select: locationSelect
    });
  }

  async removeLocation(user: JwtUser, id: number) {
    const location = await this.findLocation(user, id);
    if (
      location._count.sububicaciones > 0 ||
      location._count.equipos > 0 ||
      location._count.unidades > 0
    ) {
      throw new BadRequestException(
        "No se puede eliminar una ubicacion con sububicaciones o equipos asociados."
      );
    }

    return this.prisma.ubicacion.update({
      where: { id },
      data: {
        activa: false,
        deletedAt: new Date()
      },
      select: locationSelect
    });
  }

  private async ensureValidLocationParent(
    laboratorioId: number,
    ubicacionPadreId?: number | null,
    currentId?: number
  ) {
    if (!ubicacionPadreId) {
      return;
    }

    const parent = await this.prisma.ubicacion.findFirst({
      where: {
        id: ubicacionPadreId,
        deletedAt: null
      },
      select: {
        id: true,
        laboratorioId: true,
        ubicacionPadreId: true
      }
    });

    if (!parent) {
      throw new BadRequestException("La ubicacion padre no existe.");
    }

    if (parent.laboratorioId !== laboratorioId) {
      throw new BadRequestException("La ubicacion padre debe pertenecer al mismo laboratorio.");
    }

    let cursor = parent.ubicacionPadreId;
    while (cursor) {
      if (cursor === currentId) {
        throw new BadRequestException("La jerarquia de ubicaciones genera un ciclo.");
      }
      const next = await this.prisma.ubicacion.findUnique({
        where: { id: cursor },
        select: {
          id: true,
          ubicacionPadreId: true
        }
      });
      cursor = next?.ubicacionPadreId ?? null;
    }
  }

  private async ensureLaboratoryInScope(user: JwtUser, laboratorioId: number) {
    const laboratory = await this.prisma.laboratorio.findFirst({
      where: {
        id: laboratorioId,
        deletedAt: null
      },
      select: {
        id: true,
        nombre: true,
        codigo: true,
        facultadId: true
      }
    });

    if (!laboratory) {
      throw new BadRequestException("El laboratorio indicado no existe.");
    }

    assertFacultyAccess(user, laboratory.facultadId);
    return laboratory;
  }
}

function handleKnownDatabaseError(error: unknown, uniqueMessage: string): never {
  if (isPrismaError(error, "P2002")) {
    throw new ConflictException(uniqueMessage);
  }
  if (isPrismaError(error, "P2003")) {
    throw new BadRequestException("La referencia indicada no existe.");
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
