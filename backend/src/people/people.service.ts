import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { Prisma, RolPersonaPrestamo } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { BulkUpsertPeopleDto } from "./dto/bulk-upsert-people.dto";
import { CreatePersonDto } from "./dto/create-person.dto";
import { ListPeopleQueryDto } from "./dto/list-people-query.dto";
import { UpdatePersonDto } from "./dto/update-person.dto";

const personSelect = {
  id: true,
  codigo: true,
  nombre: true,
  correoInstitucional: true,
  carrera: true,
  semestre: true,
  rol: true,
  activo: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.PersonaPrestamoSelect;

@Injectable()
export class PeopleService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListPeopleQueryDto) {
    const search = query.search?.trim();
    const carrera = query.carrera?.trim();
    const where: Prisma.PersonaPrestamoWhereInput = {
      deletedAt: null,
      activo: query.activo,
      rol: query.rol,
      semestre: query.semestre,
      carrera: carrera ? { contains: carrera, mode: "insensitive" } : undefined,
      OR: search
        ? [
            { codigo: { contains: search, mode: "insensitive" } },
            { nombre: { contains: search, mode: "insensitive" } },
            { correoInstitucional: { contains: search, mode: "insensitive" } }
          ]
        : undefined
    };

    const activeSummaryWhere = {
      deletedAt: null,
      activo: true
    } satisfies Prisma.PersonaPrestamoWhereInput;

    const [data, total, estudiantes, profesores, administrativos] = await this.prisma.$transaction([
      this.prisma.personaPrestamo.findMany({
        where,
        select: personSelect,
        orderBy: [{ activo: "desc" }, { nombre: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      }),
      this.prisma.personaPrestamo.count({ where }),
      this.prisma.personaPrestamo.count({
        where: { ...activeSummaryWhere, rol: RolPersonaPrestamo.ESTUDIANTE }
      }),
      this.prisma.personaPrestamo.count({
        where: { ...activeSummaryWhere, rol: RolPersonaPrestamo.PROFESOR }
      }),
      this.prisma.personaPrestamo.count({
        where: { ...activeSummaryWhere, rol: RolPersonaPrestamo.ADMINISTRATIVO }
      })
    ]);

    return {
      data,
      page: query.page,
      pageSize: query.pageSize,
      total,
      summary: {
        estudiantes,
        profesores,
        administrativos
      }
    };
  }

  async create(dto: CreatePersonDto) {
    const data = normalizePersonDto(dto);
    await this.ensureUniqueCode(data.codigo);
    return this.prisma.personaPrestamo.create({
      data,
      select: personSelect
    });
  }

  async findOne(id: number) {
    const person = await this.prisma.personaPrestamo.findFirst({
      where: {
        id,
        deletedAt: null
      },
      select: personSelect
    });
    if (!person) {
      throw new NotFoundException("Persona no encontrada.");
    }
    return person;
  }

  async update(id: number, dto: UpdatePersonDto) {
    await this.findOne(id);
    const data = normalizePersonUpdateDto(dto);
    if (data.codigo) {
      await this.ensureUniqueCode(data.codigo, id);
    }

    return this.prisma.personaPrestamo.update({
      where: { id },
      data,
      select: personSelect
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    const loans = await this.prisma.prestamo.count({
      where: {
        personaSolicitanteId: id,
        deletedAt: null
      }
    });

    return this.prisma.personaPrestamo.update({
      where: { id },
      data:
        loans > 0
          ? {
              activo: false
            }
          : {
              activo: false,
              deletedAt: new Date()
            },
      select: personSelect
    });
  }

  async bulkUpsert(dto: BulkUpsertPeopleDto) {
    const normalized = dto.personas.map((person) => normalizePersonDto(person));
    const codes = new Set<string>();
    for (const person of normalized) {
      if (codes.has(person.codigo)) {
        throw new BadRequestException(`El CSV tiene codigo repetido: ${person.codigo}.`);
      }
      codes.add(person.codigo);
    }

    let created = 0;
    let updated = 0;
    const result = await this.prisma.$transaction(async (tx) => {
      const rows = [];
      for (const person of normalized) {
        const existing = await tx.personaPrestamo.findUnique({
          where: { codigo: person.codigo },
          select: { id: true }
        });
        if (existing) {
          updated += 1;
        } else {
          created += 1;
        }
        rows.push(
          await tx.personaPrestamo.upsert({
            where: { codigo: person.codigo },
            create: person,
            update: {
              ...person,
              activo: true,
              deletedAt: null
            },
            select: personSelect
          })
        );
      }
      return rows;
    });

    return {
      created,
      updated,
      total: result.length,
      data: result
    };
  }

  private async ensureUniqueCode(codigo: string, excludeId?: number) {
    const existing = await this.prisma.personaPrestamo.findFirst({
      where: {
        codigo,
        deletedAt: null,
        id: excludeId ? { not: excludeId } : undefined
      },
      select: {
        id: true
      }
    });
    if (existing) {
      throw new ConflictException("El codigo ya esta registrado.");
    }
  }
}

function normalizePersonDto(dto: CreatePersonDto) {
  const codigo = cleanRequiredText(dto.codigo);
  const nombre = cleanRequiredText(dto.nombre);
  validateStudentFields(dto.rol, dto.semestre);
  return {
    codigo,
    nombre,
    correoInstitucional: cleanNullableText(dto.correoInstitucional)?.toLowerCase() ?? null,
    carrera: cleanNullableText(dto.carrera),
    semestre: dto.rol === RolPersonaPrestamo.ESTUDIANTE ? (dto.semestre ?? null) : null,
    rol: dto.rol,
    activo: dto.activo ?? true
  };
}

function normalizePersonUpdateDto(dto: UpdatePersonDto) {
  if (dto.rol) {
    validateStudentFields(dto.rol, dto.semestre);
  }
  const semester =
    dto.rol && dto.rol !== RolPersonaPrestamo.ESTUDIANTE
      ? null
      : dto.semestre === undefined
        ? undefined
        : dto.semestre;
  return {
    codigo: dto.codigo ? cleanRequiredText(dto.codigo) : undefined,
    nombre: dto.nombre ? cleanRequiredText(dto.nombre) : undefined,
    correoInstitucional:
      dto.correoInstitucional === undefined
        ? undefined
        : cleanNullableText(dto.correoInstitucional)?.toLowerCase() ?? null,
    carrera: dto.carrera === undefined ? undefined : cleanNullableText(dto.carrera),
    semestre: semester,
    rol: dto.rol,
    activo: dto.activo
  };
}

function validateStudentFields(rol: RolPersonaPrestamo, semestre?: number | null) {
  if (rol !== RolPersonaPrestamo.ESTUDIANTE && semestre) {
    throw new BadRequestException("El semestre solo aplica para estudiantes.");
  }
}

function cleanRequiredText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function cleanNullableText(value?: string | null) {
  const cleaned = value?.replace(/\s+/g, " ").trim();
  return cleaned ? cleaned : null;
}
