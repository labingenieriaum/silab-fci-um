import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  findRoles() {
    return this.prisma.rol.findMany({
      where: { deletedAt: null },
      orderBy: { nombre: "asc" },
      include: {
        permisos: {
          include: {
            permiso: true
          }
        }
      }
    });
  }

  findPermissions() {
    return this.prisma.permiso.findMany({
      orderBy: { codigo: "asc" }
    });
  }
}

