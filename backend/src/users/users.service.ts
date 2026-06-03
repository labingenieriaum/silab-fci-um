import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { getUserFacultyScope, resolveFacultyForWrite } from "../common/faculty-scope";
import type { JwtUser } from "../common/types/jwt-user";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { ListUsersQueryDto } from "./dto/list-users-query.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

const userSelect = {
  id: true,
  rolId: true,
  facultadId: true,
  programaId: true,
  nombre: true,
  correo: true,
  documento: true,
  tipoUsuario: true,
  activo: true,
  ultimoAcceso: true,
  createdAt: true,
  updatedAt: true,
  rol: {
    select: {
      id: true,
      nombre: true,
      descripcion: true
    }
  },
  facultad: {
    select: {
      id: true,
      nombre: true,
      sigla: true
    }
  },
  programa: {
    select: {
      id: true,
      nombre: true,
      codigo: true
    }
  }
} satisfies Prisma.UsuarioSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: JwtUser, query: ListUsersQueryDto) {
    const scopedFacultyId = getUserFacultyScope(user);
    const where: Prisma.UsuarioWhereInput = {
      deletedAt: null,
      facultadId: scopedFacultyId,
      rolId: query.rolId,
      programaId: query.programaId,
      activo: query.activo,
      OR: query.search
        ? [
            { nombre: { contains: query.search, mode: "insensitive" } },
            { correo: { contains: query.search, mode: "insensitive" } },
            { documento: { contains: query.search, mode: "insensitive" } }
          ]
        : undefined
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.usuario.findMany({
        where,
        select: userSelect,
        orderBy: { nombre: "asc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      }),
      this.prisma.usuario.count({ where })
    ]);

    return {
      data,
      page: query.page,
      pageSize: query.pageSize,
      total
    };
  }

  async findOne(user: JwtUser, id: number) {
    const scopedFacultyId = getUserFacultyScope(user);
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        id,
        facultadId: scopedFacultyId,
        deletedAt: null
      },
      select: userSelect
    });

    if (!usuario) {
      throw new NotFoundException("User not found.");
    }

    return usuario;
  }

  async create(user: JwtUser, dto: CreateUserDto) {
    const facultadId = resolveFacultyForWrite(user, dto.facultadId);
    await this.ensureProgramBelongsToFaculty(dto.programaId, facultadId);
    await this.ensureUnique(dto.correo, dto.documento);

    return this.prisma.usuario.create({
      data: {
        rolId: dto.rolId,
        facultadId,
        programaId: dto.programaId,
        nombre: dto.nombre.trim(),
        correo: dto.correo.trim().toLowerCase(),
        documento: dto.documento.trim(),
        passwordHash: await bcrypt.hash(dto.password, 12),
        tipoUsuario: dto.tipoUsuario,
        activo: dto.activo ?? true
      },
      select: userSelect
    });
  }

  async update(user: JwtUser, id: number, dto: UpdateUserDto) {
    const current = await this.findOne(user, id);
    const facultadId = resolveFacultyForWrite(
      user,
      dto.facultadId === undefined ? current.facultadId : dto.facultadId
    );
    const programaId = dto.programaId === undefined ? current.programaId : dto.programaId;
    await this.ensureProgramBelongsToFaculty(programaId, facultadId);

    if (dto.correo || dto.documento) {
      await this.ensureUnique(dto.correo, dto.documento, id);
    }

    return this.prisma.usuario.update({
      where: { id },
      data: {
        rolId: dto.rolId,
        facultadId: dto.facultadId === undefined ? undefined : facultadId,
        programaId,
        nombre: dto.nombre?.trim(),
        correo: dto.correo?.trim().toLowerCase(),
        documento: dto.documento?.trim(),
        passwordHash: dto.password ? await bcrypt.hash(dto.password, 12) : undefined,
        tipoUsuario: dto.tipoUsuario,
        activo: dto.activo
      },
      select: userSelect
    });
  }

  async setActive(user: JwtUser, id: number, activo: boolean) {
    await this.findOne(user, id);
    return this.prisma.usuario.update({
      where: { id },
      data: { activo },
      select: userSelect
    });
  }

  async remove(user: JwtUser, id: number) {
    await this.findOne(user, id);
    return this.prisma.usuario.update({
      where: { id },
      data: {
        activo: false,
        deletedAt: new Date()
      },
      select: userSelect
    });
  }

  private async ensureUnique(correo?: string, documento?: string, excludeId?: number) {
    if (!correo && !documento) {
      return;
    }

    const existing = await this.prisma.usuario.findFirst({
      where: {
        deletedAt: null,
        id: excludeId ? { not: excludeId } : undefined,
        OR: [
          correo ? { correo: correo.trim().toLowerCase() } : undefined,
          documento ? { documento: documento.trim() } : undefined
        ].filter(Boolean) as Prisma.UsuarioWhereInput[]
      },
      select: {
        id: true
      }
    });

    if (existing) {
      throw new ConflictException("Email or document is already registered.");
    }
  }

  private async ensureProgramBelongsToFaculty(
    programaId?: number | null,
    facultadId?: number | null
  ) {
    if (!programaId) {
      return;
    }

    const program = await this.prisma.programa.findFirst({
      where: {
        id: programaId,
        deletedAt: null
      },
      select: {
        facultadId: true
      }
    });

    if (!program) {
      throw new BadRequestException("El programa indicado no existe.");
    }

    if (facultadId && program.facultadId !== facultadId) {
      throw new BadRequestException("El programa no pertenece a la facultad seleccionada.");
    }
  }
}
