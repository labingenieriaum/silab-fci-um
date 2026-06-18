import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  EstadoCondicionEquipo,
  EstadoEquipo,
  EstadoMantenimiento,
  TipoMovimiento,
  type Prisma
} from "@prisma/client";
import { getUserFacultyScope } from "../common/faculty-scope";
import type { JwtUser } from "../common/types/jwt-user";
import { PrismaService } from "../prisma/prisma.service";
import { CloseMaintenanceDto } from "./dto/close-maintenance.dto";
import { CreateMaintenanceDto } from "./dto/create-maintenance.dto";
import { ListMaintenanceQueryDto } from "./dto/list-maintenance-query.dto";

type MaintenanceTx = Prisma.TransactionClient;

const maintenanceSelect = {
  id: true,
  equipoId: true,
  equipoUnidadId: true,
  responsableId: true,
  tipoMantenimiento: true,
  descripcion: true,
  fechaInicio: true,
  fechaFin: true,
  costo: true,
  estado: true,
  observaciones: true,
  createdAt: true,
  updatedAt: true,
  equipo: {
    select: {
      id: true,
      codigoInterno: true,
      nombre: true,
      requiereSerial: true,
      estado: true,
      cantidadDisponible: true,
      cantidadPrestada: true,
      cantidadMantenimiento: true,
      cantidadBaja: true,
      ubicacion: {
        select: {
          id: true,
          nombre: true,
          laboratorio: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
              facultadId: true
            }
          }
        }
      }
    }
  },
  equipoUnidad: {
    select: {
      id: true,
      codigoInterno: true,
      serial: true,
      estado: true,
      ubicacionId: true
    }
  },
  responsable: {
    select: {
      id: true,
      nombre: true,
      correo: true
    }
  }
} satisfies Prisma.MantenimientoSelect;

@Injectable()
export class MaintenanceService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(user: JwtUser, query: ListMaintenanceQueryDto) {
    const scopedFacultyId = getUserFacultyScope(user);
    const where: Prisma.MantenimientoWhereInput = {
      deletedAt: null,
      estado: query.estado,
      equipoId: query.equipoId,
      equipo: {
        ubicacion: {
          laboratorio: {
            facultadId: scopedFacultyId
          }
        }
      },
      OR: query.search
        ? [
            { descripcion: { contains: query.search, mode: "insensitive" } },
            { observaciones: { contains: query.search, mode: "insensitive" } },
            { equipo: { codigoInterno: { contains: query.search, mode: "insensitive" } } },
            { equipo: { codigoBarras: { contains: query.search, mode: "insensitive" } } },
            { equipo: { qrToken: { contains: query.search, mode: "insensitive" } } },
            { equipo: { nombre: { contains: query.search, mode: "insensitive" } } },
            {
              equipoUnidad: {
                codigoInterno: { contains: query.search, mode: "insensitive" }
              }
            },
            { equipoUnidad: { serial: { contains: query.search, mode: "insensitive" } } }
          ]
        : undefined
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.mantenimiento.findMany({
        where,
        select: maintenanceSelect,
        orderBy: { fechaInicio: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      }),
      this.prisma.mantenimiento.count({ where })
    ]);

    return {
      data,
      page: query.page,
      pageSize: query.pageSize,
      total
    };
  }

  findOne(user: JwtUser, id: number) {
    return this.findMaintenanceOrThrow(user, id);
  }

  async create(user: JwtUser, dto: CreateMaintenanceDto) {
    const equipment = await this.ensureEquipmentInScope(user, dto.equipoId);
    if (equipment.requiereSerial && !dto.equipoUnidadId) {
      throw new BadRequestException("El equipo serializado requiere seleccionar una unidad.");
    }

    const unit = dto.equipoUnidadId
      ? await this.ensureUnitInScope(user, dto.equipoId, dto.equipoUnidadId)
      : null;
    const aggregateAlreadyInMaintenance =
      !unit && equipment.cantidadDisponible < 1 && equipment.cantidadMantenimiento > 0;

    if (!unit && !aggregateAlreadyInMaintenance && equipment.cantidadDisponible < 1) {
      throw new BadRequestException("El equipo no tiene disponibilidad para enviar a mantenimiento.");
    }
    if (aggregateAlreadyInMaintenance) {
      await this.ensureAggregateMaintenanceSlot(equipment.id, equipment.cantidadMantenimiento);
    }

    return this.prisma.$transaction(async (tx) => {
      const maintenance = await tx.mantenimiento.create({
        data: {
          equipoId: dto.equipoId,
          equipoUnidadId: dto.equipoUnidadId ?? null,
          responsableId: user.sub,
          tipoMantenimiento: dto.tipoMantenimiento,
          descripcion: dto.descripcion.trim(),
          fechaInicio: new Date(),
          estado: EstadoMantenimiento.ABIERTO,
          observaciones: cleanNullableText(dto.observaciones)
        },
        select: {
          id: true
        }
      });

      await this.moveIntoMaintenance(
        tx,
        user,
        maintenance.id,
        equipment,
        unit,
        !aggregateAlreadyInMaintenance
      );

      return tx.mantenimiento.findUniqueOrThrow({
        where: { id: maintenance.id },
        select: maintenanceSelect
      });
    });
  }

  async start(user: JwtUser, id: number) {
    const maintenance = await this.findMaintenanceOrThrow(user, id);
    if (maintenance.estado !== EstadoMantenimiento.ABIERTO) {
      throw new BadRequestException("Solo se puede iniciar un mantenimiento abierto.");
    }

    return this.prisma.mantenimiento.update({
      where: { id },
      data: {
        estado: EstadoMantenimiento.EN_PROCESO
      },
      select: maintenanceSelect
    });
  }

  async close(user: JwtUser, id: number, dto: CloseMaintenanceDto) {
    const maintenance = await this.findMaintenanceOrThrow(user, id);
    if (
      !([EstadoMantenimiento.ABIERTO, EstadoMantenimiento.EN_PROCESO] as EstadoMantenimiento[]).includes(
        maintenance.estado
      )
    ) {
      throw new BadRequestException("Solo se puede cerrar un mantenimiento abierto o en proceso.");
    }

    return this.prisma.$transaction(async (tx) => {
      await this.moveOutOfMaintenance(tx, user, id, maintenance, dto.estadoSalida);

      return tx.mantenimiento.update({
        where: { id },
        data: {
          estado: EstadoMantenimiento.FINALIZADO,
          fechaFin: new Date(),
          observaciones:
            dto.observaciones === undefined ? undefined : cleanNullableText(dto.observaciones)
        },
        select: maintenanceSelect
      });
    });
  }

  async cancel(user: JwtUser, id: number) {
    const maintenance = await this.findMaintenanceOrThrow(user, id);
    if (
      !([EstadoMantenimiento.ABIERTO, EstadoMantenimiento.EN_PROCESO] as EstadoMantenimiento[]).includes(
        maintenance.estado
      )
    ) {
      throw new BadRequestException("Solo se puede cancelar un mantenimiento abierto o en proceso.");
    }

    return this.prisma.$transaction(async (tx) => {
      await this.moveOutOfMaintenance(tx, user, id, maintenance, EstadoCondicionEquipo.BUENO);

      return tx.mantenimiento.update({
        where: { id },
        data: {
          estado: EstadoMantenimiento.CANCELADO,
          fechaFin: new Date()
        },
        select: maintenanceSelect
      });
    });
  }

  private async findMaintenanceOrThrow(user: JwtUser, id: number) {
    const scopedFacultyId = getUserFacultyScope(user);
    const maintenance = await this.prisma.mantenimiento.findFirst({
      where: {
        id,
        deletedAt: null,
        equipo: {
          ubicacion: {
            laboratorio: {
              facultadId: scopedFacultyId
            }
          }
        }
      },
      select: maintenanceSelect
    });

    if (!maintenance) {
      throw new NotFoundException("Mantenimiento no encontrado.");
    }

    return maintenance;
  }

  private async ensureEquipmentInScope(user: JwtUser, equipmentId: number) {
    const scopedFacultyId = getUserFacultyScope(user);
    const equipment = await this.prisma.equipo.findFirst({
      where: {
        id: equipmentId,
        deletedAt: null,
        ubicacion: {
          laboratorio: {
            facultadId: scopedFacultyId
          }
        }
      },
      select: {
        id: true,
        ubicacionId: true,
        nombre: true,
        requiereSerial: true,
        cantidadDisponible: true,
        cantidadPrestada: true,
        cantidadMantenimiento: true,
        cantidadBaja: true
      }
    });

    if (!equipment) {
      throw new BadRequestException("El equipo indicado no existe o no pertenece a tu facultad.");
    }

    return equipment;
  }

  private async ensureUnitInScope(user: JwtUser, equipmentId: number, unitId: number) {
    const scopedFacultyId = getUserFacultyScope(user);
    const unit = await this.prisma.equipoUnidad.findFirst({
      where: {
        id: unitId,
        equipoId: equipmentId,
        deletedAt: null,
        equipo: {
          ubicacion: {
            laboratorio: {
              facultadId: scopedFacultyId
            }
          }
        }
      },
      select: {
        id: true,
        equipoId: true,
        ubicacionId: true,
        estado: true
      }
    });

    if (!unit) {
      throw new BadRequestException("La unidad indicada no existe o no pertenece al equipo.");
    }

    if (
      ([
        EstadoEquipo.PRESTADO,
        EstadoEquipo.EN_MANTENIMIENTO,
        EstadoEquipo.BAJA,
        EstadoEquipo.PERDIDO,
        EstadoEquipo.INACTIVO
      ] as EstadoEquipo[]).includes(unit.estado)
    ) {
      throw new BadRequestException("La unidad no esta disponible para mantenimiento.");
    }

    return unit;
  }

  private async ensureAggregateMaintenanceSlot(equipmentId: number, maintenanceCount: number) {
    const activeCount = await this.prisma.mantenimiento.count({
      where: {
        equipoId: equipmentId,
        equipoUnidadId: null,
        deletedAt: null,
        estado: {
          in: [EstadoMantenimiento.ABIERTO, EstadoMantenimiento.EN_PROCESO]
        }
      }
    });

    if (activeCount >= maintenanceCount) {
      throw new BadRequestException("No hay items pendientes disponibles para abrir otro mantenimiento.");
    }
  }

  private async moveIntoMaintenance(
    tx: MaintenanceTx,
    user: JwtUser,
    maintenanceId: number,
    equipment: {
      id: number;
      ubicacionId: number;
      cantidadDisponible: number;
      cantidadPrestada: number;
      cantidadMantenimiento: number;
      cantidadBaja: number;
    },
    unit: { id: number; ubicacionId: number | null; estado: EstadoEquipo } | null,
    updateCounts: boolean
  ) {
    const countChange = updateCounts && (!unit || unit.estado === EstadoEquipo.DISPONIBLE);
    if (unit) {
      await tx.equipoUnidad.update({
        where: { id: unit.id },
        data: {
          estado: EstadoEquipo.EN_MANTENIMIENTO
        }
      });
    }

    const updated = await tx.equipo.update({
      where: { id: equipment.id },
      data: countChange
        ? {
            cantidadDisponible: { decrement: 1 },
            cantidadMantenimiento: { increment: 1 }
          }
        : {},
      select: {
        cantidadDisponible: true,
        cantidadPrestada: true,
        cantidadMantenimiento: true,
        cantidadBaja: true
      }
    });

    await tx.equipo.update({
      where: { id: equipment.id },
      data: {
        estado: resolveEquipmentState(updated)
      }
    });

    await tx.inventarioMovimiento.create({
      data: {
        equipoId: equipment.id,
        equipoUnidadId: unit?.id,
        usuarioId: user.sub,
        mantenimientoId: maintenanceId,
        ubicacionOrigenId: unit?.ubicacionId ?? equipment.ubicacionId,
        tipoMovimiento: TipoMovimiento.MANTENIMIENTO_ENTRADA,
        cantidad: 1,
        cantidadAnterior: equipment.cantidadDisponible,
        cantidadNueva: updated.cantidadDisponible,
        descripcion: "Ingreso a mantenimiento"
      }
    });
  }

  private async moveOutOfMaintenance(
    tx: MaintenanceTx,
    user: JwtUser,
    maintenanceId: number,
    maintenance: Prisma.MantenimientoGetPayload<{ select: typeof maintenanceSelect }>,
    condition: EstadoCondicionEquipo
  ) {
    const isUsable = ([
      EstadoCondicionEquipo.BUENO,
      EstadoCondicionEquipo.REGULAR,
      EstadoCondicionEquipo.NO_APLICA
    ] as EstadoCondicionEquipo[]).includes(condition);
    const isLost = condition === EstadoCondicionEquipo.PERDIDO;

    const equipment = await tx.equipo.findUniqueOrThrow({
      where: { id: maintenance.equipoId },
      select: {
        id: true,
        ubicacionId: true,
        cantidadDisponible: true,
        cantidadPrestada: true,
        cantidadMantenimiento: true,
        cantidadBaja: true
      }
    });

    if (maintenance.equipoUnidadId) {
      await tx.equipoUnidad.update({
        where: { id: maintenance.equipoUnidadId },
        data: {
          estado: isUsable
            ? EstadoEquipo.DISPONIBLE
            : isLost
              ? EstadoEquipo.PERDIDO
              : EstadoEquipo.DANADO
        }
      });
    }

    const movesOutOfMaintenance = isUsable || isLost;
    const updated = await tx.equipo.update({
      where: { id: equipment.id },
      data: movesOutOfMaintenance
        ? {
            cantidadDisponible: isUsable ? { increment: 1 } : undefined,
            cantidadMantenimiento: { decrement: 1 },
            cantidadBaja: isLost ? { increment: 1 } : undefined
          }
        : {},
      select: {
        cantidadDisponible: true,
        cantidadPrestada: true,
        cantidadMantenimiento: true,
        cantidadBaja: true
      }
    });

    await tx.equipo.update({
      where: { id: equipment.id },
      data: {
        estado: resolveEquipmentState(updated)
      }
    });

    await tx.inventarioMovimiento.create({
      data: {
        equipoId: equipment.id,
        equipoUnidadId: maintenance.equipoUnidadId,
        usuarioId: user.sub,
        mantenimientoId: maintenanceId,
        ubicacionDestinoId: maintenance.equipoUnidad?.ubicacionId ?? equipment.ubicacionId,
        tipoMovimiento: TipoMovimiento.MANTENIMIENTO_SALIDA,
        cantidad: 1,
        cantidadAnterior: equipment.cantidadDisponible,
        cantidadNueva: updated.cantidadDisponible,
        descripcion: `Salida de mantenimiento (${condition})`
      }
    });
  }
}

function resolveEquipmentState(counts: {
  cantidadDisponible: number;
  cantidadPrestada?: number;
  cantidadMantenimiento?: number;
  cantidadBaja?: number;
}) {
  if (counts.cantidadDisponible > 0) {
    return EstadoEquipo.DISPONIBLE;
  }
  if ((counts.cantidadPrestada ?? 0) > 0) {
    return EstadoEquipo.PRESTADO;
  }
  if ((counts.cantidadMantenimiento ?? 0) > 0) {
    return EstadoEquipo.EN_MANTENIMIENTO;
  }
  if ((counts.cantidadBaja ?? 0) > 0) {
    return EstadoEquipo.BAJA;
  }
  return EstadoEquipo.INACTIVO;
}

function cleanNullableText(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}
