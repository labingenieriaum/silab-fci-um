import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ListAgreementsQueryDto, UpsertAgreementDto } from "./dto/agreement.dto";

const agreementSelect = {
  id: true,
  nombre: true,
  identificacion: true,
  correo: true,
  telefono: true,
  contacto: true,
  observaciones: true,
  documentoNombre: true,
  documentoMimeType: true,
  documentoBase64: true,
  activo: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      equipos: true
    }
  }
} satisfies Prisma.ConvenioSelect;

@Injectable()
export class AgreementsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListAgreementsQueryDto) {
    const where: Prisma.ConvenioWhereInput = {
      deletedAt: null,
      activo: query.activo,
      OR: query.search
        ? [
            { nombre: { contains: query.search, mode: "insensitive" } },
            { identificacion: { contains: query.search, mode: "insensitive" } },
            { correo: { contains: query.search, mode: "insensitive" } },
            { telefono: { contains: query.search, mode: "insensitive" } },
            { contacto: { contains: query.search, mode: "insensitive" } }
          ]
        : undefined
    };

    const [data, total] = await Promise.all([
      this.prisma.convenio.findMany({
        where,
        select: agreementSelect,
        orderBy: [{ activo: "desc" }, { nombre: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      }),
      this.prisma.convenio.count({ where })
    ]);

    return { data, page: query.page, pageSize: query.pageSize, total };
  }

  async create(dto: UpsertAgreementDto) {
    if (!dto.nombre?.trim()) {
      throw new BadRequestException("El nombre del convenio es obligatorio.");
    }
    return this.prisma.convenio.create({
      data: cleanAgreementData(dto),
      select: agreementSelect
    });
  }

  async update(id: number, dto: UpsertAgreementDto) {
    await this.ensureExists(id);
    return this.prisma.convenio.update({
      where: { id },
      data: cleanAgreementData(dto),
      select: agreementSelect
    });
  }

  async remove(id: number) {
    const agreement = await this.ensureExists(id);
    if (agreement._count.equipos > 0) {
      return this.prisma.convenio.update({
        where: { id },
        data: { activo: false },
        select: agreementSelect
      });
    }
    return this.prisma.convenio.update({
      where: { id },
      data: { deletedAt: new Date(), activo: false },
      select: agreementSelect
    });
  }

  private async ensureExists(id: number) {
    const agreement = await this.prisma.convenio.findFirst({
      where: { id, deletedAt: null },
      select: agreementSelect
    });
    if (!agreement) {
      throw new NotFoundException("Convenio no encontrado.");
    }
    return agreement;
  }
}

function cleanAgreementData(dto: UpsertAgreementDto): Prisma.ConvenioUncheckedCreateInput {
  return {
    nombre: dto.nombre.trim(),
    identificacion: cleanNullableText(dto.identificacion),
    correo: cleanNullableText(dto.correo),
    telefono: cleanNullableText(dto.telefono),
    contacto: cleanNullableText(dto.contacto),
    observaciones: cleanNullableText(dto.observaciones),
    documentoNombre: cleanNullableText(dto.documentoNombre),
    documentoMimeType: cleanNullableText(dto.documentoMimeType),
    documentoBase64: cleanNullableText(dto.documentoBase64),
    activo: dto.activo ?? true
  };
}

function cleanNullableText(value?: string | null) {
  const clean = value?.trim();
  return clean ? clean : null;
}
