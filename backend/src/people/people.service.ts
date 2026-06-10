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
    const data = await this.normalizePersonDto(dto, { strictAffiliation: true });
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
    const current = await this.findOne(id);
    const data = await this.normalizePersonUpdateDto(dto, current);
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
    const normalized = await Promise.all(
      dto.personas.map((person) => this.normalizePersonDto(person, { strictAffiliation: false }))
    );
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
      afiliacionesNulas: normalized.filter((person) => !person.carrera).length,
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

  private async normalizePersonDto(dto: CreatePersonDto, options: { strictAffiliation: boolean }) {
    const codigo = cleanRequiredText(dto.codigo);
    const nombre = cleanRequiredText(dto.nombre);
    validateStudentFields(dto.rol, dto.semestre);
    return {
      codigo,
      nombre,
      correoInstitucional: cleanNullableText(dto.correoInstitucional)?.toLowerCase() ?? null,
      carrera: await this.normalizeAffiliation(dto.rol, dto.carrera, options.strictAffiliation),
      semestre: dto.rol === RolPersonaPrestamo.ESTUDIANTE ? (dto.semestre ?? null) : null,
      rol: dto.rol,
      activo: dto.activo ?? true
    };
  }

  private async normalizePersonUpdateDto(dto: UpdatePersonDto, current: { rol: RolPersonaPrestamo; carrera: string | null }) {
    const role = dto.rol ?? current.rol;
    validateStudentFields(role, dto.semestre);
    const semester =
      role !== RolPersonaPrestamo.ESTUDIANTE
        ? null
        : dto.semestre === undefined
          ? undefined
          : dto.semestre;
    const shouldNormalizeAffiliation = dto.carrera !== undefined || dto.rol !== undefined;

    return {
      codigo: dto.codigo ? cleanRequiredText(dto.codigo) : undefined,
      nombre: dto.nombre ? cleanRequiredText(dto.nombre) : undefined,
      correoInstitucional:
        dto.correoInstitucional === undefined
          ? undefined
          : cleanNullableText(dto.correoInstitucional)?.toLowerCase() ?? null,
      carrera: shouldNormalizeAffiliation
        ? await this.normalizeAffiliation(role, dto.carrera === undefined ? current.carrera : dto.carrera, true)
        : undefined,
      semestre: semester,
      rol: dto.rol,
      activo: dto.activo
    };
  }

  private async normalizeAffiliation(rol: RolPersonaPrestamo, value: string | null | undefined, strict: boolean) {
    const cleaned = cleanNullableText(value);
    if (!cleaned) {
      if (strict) {
        throw new BadRequestException(affiliationRequiredMessage(rol));
      }
      return null;
    }

    if (rol === RolPersonaPrestamo.ESTUDIANTE) {
      const programs = await this.prisma.programa.findMany({
        where: {
          deletedAt: null
        },
        select: { nombre: true, codigo: true }
      });
      const normalized = normalizeCatalogText(cleaned);
      const program = programs.find(
        (item) => normalizeCatalogText(item.nombre) === normalized || normalizeCatalogText(item.codigo) === normalized
      );
      if (!program) {
        if (!strict) {
          return null;
        }
        throw new BadRequestException("La carrera debe corresponder a un programa academico existente.");
      }
      return program.nombre;
    }

    if (rol === RolPersonaPrestamo.PROFESOR) {
      const faculties = await this.prisma.facultad.findMany({
        where: {
          deletedAt: null
        },
        select: { nombre: true, sigla: true }
      });
      const normalized = normalizeCatalogText(cleaned);
      const faculty = faculties.find(
        (item) => normalizeCatalogText(item.nombre) === normalized || normalizeCatalogText(item.sigla) === normalized
      );
      if (!faculty) {
        if (!strict) {
          return null;
        }
        throw new BadRequestException("La facultad del profesor debe existir en el catalogo de facultades.");
      }
      return faculty.nombre;
    }

    return cleaned;
  }
}

function validateStudentFields(rol: RolPersonaPrestamo, semestre?: number | null) {
  if (rol !== RolPersonaPrestamo.ESTUDIANTE && semestre) {
    throw new BadRequestException("El semestre solo aplica para estudiantes.");
  }
}

function affiliationRequiredMessage(rol: RolPersonaPrestamo) {
  if (rol === RolPersonaPrestamo.ESTUDIANTE) return "Selecciona el programa academico del estudiante.";
  if (rol === RolPersonaPrestamo.PROFESOR) return "Selecciona la facultad del profesor.";
  return "La dependencia del administrativo es obligatoria.";
}

function cleanRequiredText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function cleanNullableText(value?: string | null) {
  const cleaned = value?.replace(/\s+/g, " ").trim();
  return cleaned ? cleaned : null;
}

function normalizeCatalogText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
