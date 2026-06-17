import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: { page?: number; pageSize?: number; search?: string }) {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 50));
    const where: Prisma.AuditoriaWhereInput = query.search
      ? {
          OR: [
            { accion: { contains: query.search, mode: "insensitive" } },
            { modulo: { contains: query.search, mode: "insensitive" } },
            { tablaAfectada: { contains: query.search, mode: "insensitive" } },
            { usuario: { nombre: { contains: query.search, mode: "insensitive" } } },
            { usuario: { correo: { contains: query.search, mode: "insensitive" } } }
          ]
        }
      : {};

    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditoria.findMany({
        where,
        orderBy: { fecha: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          usuarioId: true,
          accion: true,
          modulo: true,
          tablaAfectada: true,
          registroId: true,
          datosNuevos: true,
          ip: true,
          userAgent: true,
          fecha: true,
          usuario: {
            select: {
              nombre: true,
              correo: true
            }
          }
        }
      }),
      this.prisma.auditoria.count({ where })
    ]);

    return { data, page, pageSize, total };
  }
}
