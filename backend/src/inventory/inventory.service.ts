import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { EstadoEquipo, TipoMovimiento, type Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { getUserFacultyScope } from "../common/faculty-scope";
import type { JwtUser } from "../common/types/jwt-user";
import { PrismaService } from "../prisma/prisma.service";
import { CreateEquipmentCategoryDto } from "./dto/create-equipment-category.dto";
import { CreateEquipmentUnitDto } from "./dto/create-equipment-unit.dto";
import { BulkEquipmentDto } from "./dto/bulk-equipment.dto";
import { CreateEquipmentDto, EquipmentUnitInputDto } from "./dto/create-equipment.dto";
import {
  ListInventoryMovementsQueryDto,
  RegisterInventoryAdjustmentDto,
  RegisterInventoryEntryDto,
  RegisterInventoryTransferDto
} from "./dto/inventory-movement.dto";
import { ListEquipmentQueryDto } from "./dto/list-equipment-query.dto";
import { UpdateEquipmentCategoryDto } from "./dto/update-equipment-category.dto";
import { UpdateEquipmentUnitDto } from "./dto/update-equipment-unit.dto";
import { UpdateEquipmentDto } from "./dto/update-equipment.dto";

type InventoryTx = Prisma.TransactionClient;

const categorySelect = {
  id: true,
  nombre: true,
  descripcion: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      equipos: true
    }
  }
} satisfies Prisma.CategoriaEquipoSelect;

const equipmentUnitSelect = {
  id: true,
  equipoId: true,
  ubicacionId: true,
  codigoInterno: true,
  serial: true,
  estado: true,
  observaciones: true,
  createdAt: true,
  updatedAt: true,
  equipo: {
    select: {
      id: true,
      codigoInterno: true,
      nombre: true
    }
  },
  ubicacion: {
    select: {
      id: true,
      nombre: true,
      tipo: true,
      laboratorio: {
        select: {
          id: true,
          nombre: true,
          codigo: true
        }
      }
    }
  }
} satisfies Prisma.EquipoUnidadSelect;

const equipmentSelect = {
  id: true,
  categoriaId: true,
  ubicacionId: true,
  responsableId: true,
  codigoInterno: true,
  codigoBarras: true,
  qrToken: true,
  nombre: true,
  marca: true,
  modelo: true,
  requiereSerial: true,
  permitePrestamo: true,
  cantidadTotal: true,
  cantidadDisponible: true,
  cantidadPrestada: true,
  cantidadMantenimiento: true,
  cantidadBaja: true,
  estado: true,
  valorEstimado: true,
  observaciones: true,
  createdAt: true,
  updatedAt: true,
  categoria: {
    select: {
      id: true,
      nombre: true
    }
  },
  ubicacion: {
    select: {
      id: true,
      nombre: true,
      tipo: true,
      laboratorio: {
        select: {
          id: true,
          nombre: true,
          codigo: true
        }
      }
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
      unidades: true,
      movimientos: true,
      prestamoDetalles: true,
      mantenimientos: true,
      archivos: true
    }
  }
} satisfies Prisma.EquipoSelect;

const equipmentDetailSelect = {
  ...equipmentSelect,
  unidades: {
    where: {
      deletedAt: null
    },
    select: equipmentUnitSelect,
    orderBy: {
      codigoInterno: "asc"
    }
  }
} satisfies Prisma.EquipoSelect;

const movementSelect = {
  id: true,
  equipoId: true,
  equipoUnidadId: true,
  usuarioId: true,
  prestamoId: true,
  devolucionId: true,
  mantenimientoId: true,
  ubicacionOrigenId: true,
  ubicacionDestinoId: true,
  tipoMovimiento: true,
  cantidad: true,
  cantidadAnterior: true,
  cantidadNueva: true,
  descripcion: true,
  metadata: true,
  fecha: true,
  equipo: {
    select: {
      id: true,
      codigoInterno: true,
      nombre: true
    }
  },
  equipoUnidad: {
    select: {
      id: true,
      codigoInterno: true,
      serial: true,
      estado: true
    }
  },
  usuario: {
    select: {
      id: true,
      nombre: true,
      correo: true
    }
  },
  ubicacionOrigen: {
    select: {
      id: true,
      nombre: true
    }
  },
  ubicacionDestino: {
    select: {
      id: true,
      nombre: true
    }
  }
} satisfies Prisma.InventarioMovimientoSelect;

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  findCategories() {
    return this.prisma.categoriaEquipo.findMany({
      where: { deletedAt: null },
      select: categorySelect,
      orderBy: { nombre: "asc" }
    });
  }

  async createCategory(dto: CreateEquipmentCategoryDto) {
    try {
      return await this.prisma.categoriaEquipo.create({
        data: {
          nombre: dto.nombre.trim(),
          descripcion: cleanNullableText(dto.descripcion)
        },
        select: categorySelect
      });
    } catch (error) {
      handleKnownDatabaseError(error, "Ya existe una categoria con ese nombre.");
    }
  }

  async updateCategory(id: number, dto: UpdateEquipmentCategoryDto) {
    await this.findCategoryOrThrow(id);
    try {
      return await this.prisma.categoriaEquipo.update({
        where: { id },
        data: {
          nombre: dto.nombre?.trim(),
          descripcion:
            dto.descripcion === undefined ? undefined : cleanNullableText(dto.descripcion)
        },
        select: categorySelect
      });
    } catch (error) {
      handleKnownDatabaseError(error, "Ya existe una categoria con ese nombre.");
    }
  }

  async removeCategory(id: number) {
    const category = await this.findCategoryOrThrow(id);
    if (category._count.equipos > 0) {
      throw new BadRequestException("No se puede eliminar una categoria con equipos asociados.");
    }

    return this.prisma.categoriaEquipo.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: categorySelect
    });
  }

  async findEquipment(user: JwtUser, query: ListEquipmentQueryDto) {
    const scopedFacultyId = getUserFacultyScope(user);
    const where: Prisma.EquipoWhereInput = {
      deletedAt: null,
      categoriaId: query.categoriaId,
      ubicacionId: query.ubicacionId,
      ubicacion: {
        laboratorio: {
          facultadId: scopedFacultyId
        }
      },
      responsableId: query.responsableId,
      estado: query.estado,
      OR: query.search
        ? [
            { codigoInterno: { contains: query.search, mode: "insensitive" } },
            { codigoBarras: { contains: query.search, mode: "insensitive" } },
            { qrToken: { contains: query.search, mode: "insensitive" } },
            { nombre: { contains: query.search, mode: "insensitive" } },
            { marca: { contains: query.search, mode: "insensitive" } },
            { modelo: { contains: query.search, mode: "insensitive" } },
            {
              unidades: {
                some: {
                  deletedAt: null,
                  codigoInterno: { contains: query.search, mode: "insensitive" }
                }
              }
            },
            {
              unidades: {
                some: {
                  deletedAt: null,
                  serial: { contains: query.search, mode: "insensitive" }
                }
              }
            }
          ]
        : undefined
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.equipo.findMany({
        where,
        select: equipmentSelect,
        orderBy: [{ nombre: "asc" }, { codigoInterno: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      }),
      this.prisma.equipo.count({ where })
    ]);

    return {
      data,
      page: query.page,
      pageSize: query.pageSize,
      total
    };
  }

  async findEquipmentById(user: JwtUser, id: number) {
    const scopedFacultyId = getUserFacultyScope(user);
    const equipment = await this.prisma.equipo.findFirst({
      where: {
        id,
        deletedAt: null,
        ubicacion: {
          laboratorio: {
            facultadId: scopedFacultyId
          }
        }
      },
      select: equipmentDetailSelect
    });

    if (!equipment) {
      throw new NotFoundException("Equipo no encontrado.");
    }

    return equipment;
  }

  async lookupEquipment(user: JwtUser, code?: string) {
    const scannedCode = normalizeScannedEquipmentCode(code);
    if (!scannedCode) {
      throw new BadRequestException("El codigo escaneado es requerido.");
    }

    const scopedFacultyId = getUserFacultyScope(user);
    const equipment = await this.prisma.equipo.findFirst({
      where: {
        deletedAt: null,
        ubicacion: {
          laboratorio: {
            facultadId: scopedFacultyId
          }
        },
        OR: [
          { codigoInterno: { equals: scannedCode, mode: "insensitive" } },
          { codigoBarras: { equals: scannedCode, mode: "insensitive" } },
          { qrToken: { equals: scannedCode, mode: "insensitive" } },
          {
            unidades: {
              some: {
                deletedAt: null,
                codigoInterno: { equals: scannedCode, mode: "insensitive" }
              }
            }
          },
          {
            unidades: {
              some: {
                deletedAt: null,
                serial: { equals: scannedCode, mode: "insensitive" }
              }
            }
          }
        ]
      },
      select: equipmentDetailSelect
    });

    if (!equipment) {
      throw new NotFoundException("Equipo no encontrado para el codigo escaneado.");
    }

    return equipment;
  }

  async createEquipment(user: JwtUser, dto: CreateEquipmentDto) {
    const units = dto.unidades ?? [];
    const total = dto.cantidadTotal ?? (units.length > 0 ? units.length : 1);
    const requiresSerial = dto.requiereSerial ?? false;

    this.ensureValidInitialUnits(total, requiresSerial, units);
    await this.ensureLocationInScope(user, dto.ubicacionId);
    await this.ensureUnitLocationsInScope(user, units);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const equipment = await tx.equipo.create({
          data: {
            categoriaId: dto.categoriaId,
            ubicacionId: dto.ubicacionId,
            responsableId: dto.responsableId ?? null,
            codigoInterno: dto.codigoInterno.trim().toUpperCase(),
            codigoBarras: cleanOptionalIdentifier(dto.codigoBarras),
            qrToken: createEquipmentQrToken(),
            nombre: dto.nombre.trim(),
            marca: cleanNullableText(dto.marca),
            modelo: cleanNullableText(dto.modelo),
            requiereSerial: requiresSerial,
            permitePrestamo: dto.permitePrestamo ?? false,
            cantidadTotal: total,
            cantidadDisponible: total,
            cantidadPrestada: 0,
            cantidadMantenimiento: 0,
            cantidadBaja: 0,
            estado: EstadoEquipo.DISPONIBLE,
            valorEstimado: dto.valorEstimado ?? 0,
            observaciones: cleanNullableText(dto.observaciones)
          },
          select: {
            id: true
          }
        });

        if (units.length > 0) {
          await tx.equipoUnidad.createMany({
            data: units.map((unit) => ({
              equipoId: equipment.id,
              ubicacionId: unit.ubicacionId ?? dto.ubicacionId,
              codigoInterno: unit.codigoInterno.trim().toUpperCase(),
              serial: cleanNullableText(unit.serial),
              estado: EstadoEquipo.DISPONIBLE,
              observaciones: cleanNullableText(unit.observaciones)
            }))
          });
        }

        await tx.inventarioMovimiento.create({
          data: {
            equipoId: equipment.id,
            usuarioId: user.sub,
            ubicacionDestinoId: dto.ubicacionId,
            tipoMovimiento: TipoMovimiento.ENTRADA,
            cantidad: total,
            cantidadAnterior: 0,
            cantidadNueva: total,
            descripcion: "Registro inicial de equipo",
            metadata: {
              codigoInterno: dto.codigoInterno.trim().toUpperCase(),
              codigoBarras: cleanOptionalIdentifier(dto.codigoBarras),
              requiereSerial: requiresSerial,
              permitePrestamo: dto.permitePrestamo ?? false
            }
          }
        });

        return tx.equipo.findUniqueOrThrow({
          where: { id: equipment.id },
          select: equipmentDetailSelect
        });
      });
    } catch (error) {
      handleKnownDatabaseError(error, "Ya existe un equipo o unidad con ese codigo, codigo de barras o identificador.");
    }
  }

  async bulkCreateEquipment(user: JwtUser, dto: BulkEquipmentDto) {
    const results: Array<{
      codigoInterno: string;
      id?: number;
      status: "created" | "error";
      message?: string;
    }> = [];

    for (const row of dto.rows) {
      try {
        const equipment = await this.createEquipment(user, row);
        results.push({
          codigoInterno: equipment.codigoInterno,
          id: equipment.id,
          status: "created"
        });
      } catch (error) {
        results.push({
          codigoInterno: row.codigoInterno,
          status: "error",
          message: error instanceof Error ? error.message : "No fue posible crear el equipo."
        });
      }
    }

    return {
      total: dto.rows.length,
      created: results.filter((item) => item.status === "created").length,
      errors: results.filter((item) => item.status === "error").length,
      results
    };
  }

  async updateEquipment(user: JwtUser, id: number, dto: UpdateEquipmentDto) {
    const current = await this.findEquipmentById(user, id);

    if (dto.requiereSerial && current.unidades.length !== current.cantidadTotal) {
      throw new BadRequestException(
        "Para activar control individual debe existir una unidad por cada item del equipo."
      );
    }
    if (dto.ubicacionId) {
      await this.ensureLocationInScope(user, dto.ubicacionId);
    }

    try {
      return await this.prisma.equipo.update({
        where: { id },
        data: {
          categoriaId: dto.categoriaId,
          ubicacionId: dto.ubicacionId,
          responsableId: dto.responsableId,
          codigoInterno: dto.codigoInterno?.trim().toUpperCase(),
          codigoBarras:
            dto.codigoBarras === undefined ? undefined : cleanOptionalIdentifier(dto.codigoBarras),
          nombre: dto.nombre?.trim(),
          marca: dto.marca === undefined ? undefined : cleanNullableText(dto.marca),
          modelo: dto.modelo === undefined ? undefined : cleanNullableText(dto.modelo),
          requiereSerial: dto.requiereSerial,
          permitePrestamo: dto.permitePrestamo,
          estado: dto.estado,
          valorEstimado: dto.valorEstimado,
          observaciones:
            dto.observaciones === undefined ? undefined : cleanNullableText(dto.observaciones)
        },
        select: equipmentDetailSelect
      });
    } catch (error) {
      handleKnownDatabaseError(error, "Ya existe un equipo con ese codigo interno o codigo de barras.");
    }
  }

  async removeEquipment(user: JwtUser, id: number) {
    const equipment = await this.findEquipmentById(user, id);
    if (equipment.cantidadPrestada > 0 || equipment.cantidadMantenimiento > 0) {
      throw new BadRequestException(
        "No se puede eliminar un equipo prestado o en mantenimiento."
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.equipoUnidad.updateMany({
        where: {
          equipoId: id,
          deletedAt: null
        },
        data: {
          estado: EstadoEquipo.INACTIVO,
          deletedAt: new Date()
        }
      });

      return tx.equipo.update({
        where: { id },
        data: {
          estado: EstadoEquipo.INACTIVO,
          deletedAt: new Date()
        },
        select: equipmentDetailSelect
      });
    });
  }

  async findEquipmentUnits(user: JwtUser, equipmentId: number) {
    await this.ensureEquipmentExists(user, equipmentId);
    return this.prisma.equipoUnidad.findMany({
      where: {
        equipoId: equipmentId,
        deletedAt: null
      },
      select: equipmentUnitSelect,
      orderBy: { codigoInterno: "asc" }
    });
  }

  async createEquipmentUnit(user: JwtUser, equipmentId: number, dto: CreateEquipmentUnitDto) {
    const equipment = await this.ensureEquipmentExists(user, equipmentId);
    if (dto.ubicacionId) {
      await this.ensureLocationInScope(user, dto.ubicacionId);
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const unit = await tx.equipoUnidad.create({
          data: {
            equipoId: equipmentId,
            ubicacionId: dto.ubicacionId ?? equipment.ubicacionId,
            codigoInterno: dto.codigoInterno.trim().toUpperCase(),
            serial: cleanNullableText(dto.serial),
            estado: EstadoEquipo.DISPONIBLE,
            observaciones: cleanNullableText(dto.observaciones)
          },
          select: equipmentUnitSelect
        });

        const updated = await tx.equipo.update({
          where: { id: equipmentId },
          data: {
            cantidadTotal: { increment: 1 },
            cantidadDisponible: { increment: 1 },
            estado: EstadoEquipo.DISPONIBLE
          },
          select: {
            cantidadDisponible: true
          }
        });

        await tx.inventarioMovimiento.create({
          data: {
            equipoId: equipmentId,
            equipoUnidadId: unit.id,
            usuarioId: user.sub,
            ubicacionDestinoId: unit.ubicacionId,
            tipoMovimiento: TipoMovimiento.ENTRADA,
            cantidad: 1,
            cantidadAnterior: updated.cantidadDisponible - 1,
            cantidadNueva: updated.cantidadDisponible,
            descripcion: "Ingreso de unidad fisica"
          }
        });

        return unit;
      });
    } catch (error) {
      handleKnownDatabaseError(error, "Ya existe una unidad con ese codigo o identificador.");
    }
  }

  async updateEquipmentUnit(user: JwtUser, id: number, dto: UpdateEquipmentUnitDto) {
    const current = await this.findUnitOrThrow(user, id);
    if (dto.ubicacionId) {
      await this.ensureLocationInScope(user, dto.ubicacionId);
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const updated = await tx.equipoUnidad.update({
          where: { id },
          data: {
            codigoInterno: dto.codigoInterno?.trim().toUpperCase(),
            serial: dto.serial === undefined ? undefined : cleanNullableText(dto.serial),
            ubicacionId: dto.ubicacionId,
            estado: dto.estado,
            observaciones:
              dto.observaciones === undefined ? undefined : cleanNullableText(dto.observaciones)
          },
          select: equipmentUnitSelect
        });

        if (dto.estado && dto.estado !== current.estado) {
          await this.recalculateEquipmentCountsByUnits(tx, current.equipoId);
        }

        if (dto.ubicacionId !== undefined && dto.ubicacionId !== current.ubicacionId) {
          await tx.inventarioMovimiento.create({
            data: {
              equipoId: current.equipoId,
              equipoUnidadId: current.id,
              usuarioId: user.sub,
              ubicacionOrigenId: current.ubicacionId,
              ubicacionDestinoId: dto.ubicacionId,
              tipoMovimiento: TipoMovimiento.TRASLADO,
              cantidad: 1,
              descripcion: "Traslado de unidad fisica"
            }
          });
        }

        return updated;
      });
    } catch (error) {
      handleKnownDatabaseError(error, "Ya existe una unidad con ese codigo o identificador.");
    }
  }

  async removeEquipmentUnit(user: JwtUser, id: number) {
    const current = await this.findUnitOrThrow(user, id);
    if (([EstadoEquipo.PRESTADO, EstadoEquipo.EN_MANTENIMIENTO] as EstadoEquipo[]).includes(current.estado)) {
      throw new BadRequestException("No se puede retirar una unidad prestada o en mantenimiento.");
    }

    return this.prisma.$transaction(async (tx) => {
      const unit = await tx.equipoUnidad.update({
        where: { id },
        data: {
          estado: EstadoEquipo.BAJA,
          deletedAt: new Date()
        },
        select: equipmentUnitSelect
      });

      const equipment = await this.recalculateEquipmentCountsByUnits(tx, current.equipoId);

      await tx.inventarioMovimiento.create({
          data: {
            equipoId: current.equipoId,
            equipoUnidadId: current.id,
            usuarioId: user.sub,
          ubicacionOrigenId: current.ubicacionId,
          tipoMovimiento: TipoMovimiento.BAJA,
          cantidad: 1,
          cantidadAnterior: equipment.cantidadDisponible + 1,
          cantidadNueva: equipment.cantidadDisponible,
          descripcion: "Baja de unidad fisica"
        }
      });

      return unit;
    });
  }

  async findMovements(user: JwtUser, query: ListInventoryMovementsQueryDto) {
    const scopedFacultyId = getUserFacultyScope(user);
    const where: Prisma.InventarioMovimientoWhereInput = {
      equipoId: query.equipoId,
      usuarioId: query.usuarioId,
      tipoMovimiento: query.tipoMovimiento,
      equipo: {
        ubicacion: {
          laboratorio: {
            facultadId: scopedFacultyId
          }
        }
      }
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.inventarioMovimiento.findMany({
        where,
        select: movementSelect,
        orderBy: { fecha: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      }),
      this.prisma.inventarioMovimiento.count({ where })
    ]);

    return {
      data,
      page: query.page,
      pageSize: query.pageSize,
      total
    };
  }

  async registerEntry(user: JwtUser, dto: RegisterInventoryEntryDto) {
    const equipment = await this.ensureEquipmentExists(user, dto.equipoId);
    if (dto.ubicacionDestinoId) {
      await this.ensureLocationInScope(user, dto.ubicacionDestinoId);
    }
    if (equipment.requiereSerial) {
      throw new BadRequestException(
        "Los equipos con control individual deben ingresar por unidades individuales."
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.equipo.update({
        where: { id: dto.equipoId },
        data: {
          ubicacionId: dto.ubicacionDestinoId ?? undefined,
          cantidadTotal: { increment: dto.cantidad },
          cantidadDisponible: { increment: dto.cantidad },
          estado: EstadoEquipo.DISPONIBLE
        },
        select: equipmentSelect
      });

      const movement = await tx.inventarioMovimiento.create({
          data: {
            equipoId: dto.equipoId,
            usuarioId: user.sub,
          ubicacionDestinoId: dto.ubicacionDestinoId ?? equipment.ubicacionId,
          tipoMovimiento: TipoMovimiento.ENTRADA,
          cantidad: dto.cantidad,
          cantidadAnterior: equipment.cantidadDisponible,
          cantidadNueva: equipment.cantidadDisponible + dto.cantidad,
          descripcion: cleanNullableText(dto.descripcion) ?? "Entrada de inventario"
        },
        select: movementSelect
      });

      return {
        equipment: updated,
        movement
      };
    });
  }

  async registerAdjustment(user: JwtUser, dto: RegisterInventoryAdjustmentDto) {
    if (
      !([
        TipoMovimiento.AJUSTE_POSITIVO,
        TipoMovimiento.AJUSTE_NEGATIVO,
        TipoMovimiento.BAJA
      ] as TipoMovimiento[]).includes(dto.tipoMovimiento)
    ) {
      throw new BadRequestException("El tipo de movimiento no es un ajuste permitido.");
    }

    const equipment = await this.ensureEquipmentExists(user, dto.equipoId);
    if (equipment.requiereSerial) {
      throw new BadRequestException(
        "Los ajustes de equipos con control individual deben hacerse sobre unidades individuales."
      );
    }

    if (
      ([TipoMovimiento.AJUSTE_NEGATIVO, TipoMovimiento.BAJA] as TipoMovimiento[]).includes(dto.tipoMovimiento) &&
      equipment.cantidadDisponible < dto.cantidad
    ) {
      throw new BadRequestException("La cantidad supera el inventario disponible.");
    }

    return this.prisma.$transaction(async (tx) => {
      const nextCounts = calculateAdjustedCounts(equipment, dto.tipoMovimiento, dto.cantidad);

      const updated = await tx.equipo.update({
        where: { id: dto.equipoId },
        data: {
          cantidadTotal: nextCounts.cantidadTotal,
          cantidadDisponible: nextCounts.cantidadDisponible,
          cantidadBaja: nextCounts.cantidadBaja,
          estado: resolveEquipmentState(nextCounts)
        },
        select: equipmentSelect
      });

      const movement = await tx.inventarioMovimiento.create({
          data: {
            equipoId: dto.equipoId,
            usuarioId: user.sub,
          tipoMovimiento: dto.tipoMovimiento,
          cantidad: dto.cantidad,
          cantidadAnterior: equipment.cantidadDisponible,
          cantidadNueva: nextCounts.cantidadDisponible,
          descripcion: cleanNullableText(dto.descripcion) ?? "Ajuste de inventario"
        },
        select: movementSelect
      });

      return {
        equipment: updated,
        movement
      };
    });
  }

  async registerTransfer(user: JwtUser, dto: RegisterInventoryTransferDto) {
    const equipment = await this.ensureEquipmentExists(user, dto.equipoId);
    await this.ensureLocationInScope(user, dto.ubicacionDestinoId);

    if (dto.equipoUnidadId) {
      const unit = await this.findUnitOrThrow(user, dto.equipoUnidadId);
      if (unit.equipoId !== dto.equipoId) {
        throw new BadRequestException("La unidad no pertenece al equipo indicado.");
      }
      if (unit.estado === EstadoEquipo.PRESTADO) {
        throw new BadRequestException("No se puede trasladar una unidad prestada.");
      }

      return this.prisma.$transaction(async (tx) => {
        const updatedUnit = await tx.equipoUnidad.update({
          where: { id: dto.equipoUnidadId },
          data: {
            ubicacionId: dto.ubicacionDestinoId
          },
          select: equipmentUnitSelect
        });

        const movement = await tx.inventarioMovimiento.create({
            data: {
              equipoId: dto.equipoId,
              equipoUnidadId: dto.equipoUnidadId,
              usuarioId: user.sub,
            ubicacionOrigenId: unit.ubicacionId,
            ubicacionDestinoId: dto.ubicacionDestinoId,
            tipoMovimiento: TipoMovimiento.TRASLADO,
            cantidad: 1,
            descripcion: cleanNullableText(dto.descripcion) ?? "Traslado de unidad"
          },
          select: movementSelect
        });

        return {
          unit: updatedUnit,
          movement
        };
      });
    }

    if (equipment.requiereSerial) {
      throw new BadRequestException("Selecciona una unidad para trasladar un equipo con control individual.");
    }

    if (dto.cantidad !== equipment.cantidadDisponible) {
      throw new BadRequestException(
        "Los traslados de inventario agregado deben mover toda la cantidad disponible."
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.equipo.update({
        where: { id: dto.equipoId },
        data: {
          ubicacionId: dto.ubicacionDestinoId
        },
        select: equipmentSelect
      });

      const movement = await tx.inventarioMovimiento.create({
          data: {
            equipoId: dto.equipoId,
            usuarioId: user.sub,
          ubicacionOrigenId: equipment.ubicacionId,
          ubicacionDestinoId: dto.ubicacionDestinoId,
          tipoMovimiento: TipoMovimiento.TRASLADO,
          cantidad: dto.cantidad,
          descripcion: cleanNullableText(dto.descripcion) ?? "Traslado de inventario"
        },
        select: movementSelect
      });

      return {
        equipment: updated,
        movement
      };
    });
  }

  private async findCategoryOrThrow(id: number) {
    const category = await this.prisma.categoriaEquipo.findFirst({
      where: { id, deletedAt: null },
      select: categorySelect
    });

    if (!category) {
      throw new NotFoundException("Categoria no encontrada.");
    }

    return category;
  }

  private async ensureEquipmentExists(user: JwtUser, id: number) {
    const scopedFacultyId = getUserFacultyScope(user);
    const equipment = await this.prisma.equipo.findFirst({
      where: {
        id,
        deletedAt: null,
        ubicacion: {
          laboratorio: {
            facultadId: scopedFacultyId
          }
        }
      }
    });

    if (!equipment) {
      throw new NotFoundException("Equipo no encontrado.");
    }

    return equipment;
  }

  private async findUnitOrThrow(user: JwtUser, id: number) {
    const scopedFacultyId = getUserFacultyScope(user);
    const unit = await this.prisma.equipoUnidad.findFirst({
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
      select: equipmentUnitSelect
    });

    if (!unit) {
      throw new NotFoundException("Unidad no encontrada.");
    }

    return unit;
  }

  private async ensureLocationInScope(user: JwtUser, ubicacionId: number) {
    const scopedFacultyId = getUserFacultyScope(user);
    const location = await this.prisma.ubicacion.findFirst({
      where: {
        id: ubicacionId,
        deletedAt: null,
        laboratorio: {
          facultadId: scopedFacultyId
        }
      },
      select: {
        id: true
      }
    });

    if (!location) {
      throw new BadRequestException("La ubicacion indicada no existe o no pertenece a tu facultad.");
    }
  }

  private async ensureUnitLocationsInScope(user: JwtUser, units: EquipmentUnitInputDto[]) {
    const locationIds = Array.from(
      new Set(units.map((unit) => unit.ubicacionId).filter(Boolean) as number[])
    );

    for (const locationId of locationIds) {
      await this.ensureLocationInScope(user, locationId);
    }
  }

  private ensureValidInitialUnits(
    total: number,
    requiresSerial: boolean,
    units: EquipmentUnitInputDto[]
  ) {
    if (total < 1) {
      throw new BadRequestException("La cantidad total debe ser mayor que cero.");
    }

    if (units.length > 0 && units.length !== total) {
      throw new BadRequestException("La cantidad total debe coincidir con las unidades registradas.");
    }

    if (requiresSerial && units.length !== total) {
      throw new BadRequestException(
        "Los equipos con control individual requieren una unidad fisica por cada cantidad registrada."
      );
    }
  }

  private async recalculateEquipmentCountsByUnits(tx: InventoryTx, equipmentId: number) {
    const units = await tx.equipoUnidad.findMany({
      where: {
        equipoId: equipmentId,
        deletedAt: null
      },
      select: {
        estado: true
      }
    });

    const counts = units.reduce(
      (acc, unit) => {
        acc.cantidadTotal += 1;
        if (unit.estado === EstadoEquipo.DISPONIBLE) {
          acc.cantidadDisponible += 1;
        }
        if (unit.estado === EstadoEquipo.PRESTADO) {
          acc.cantidadPrestada += 1;
        }
        if (([EstadoEquipo.EN_MANTENIMIENTO, EstadoEquipo.DANADO] as EstadoEquipo[]).includes(unit.estado)) {
          acc.cantidadMantenimiento += 1;
        }
        if (([EstadoEquipo.BAJA, EstadoEquipo.PERDIDO, EstadoEquipo.INACTIVO] as EstadoEquipo[]).includes(unit.estado)) {
          acc.cantidadBaja += 1;
        }
        return acc;
      },
      {
        cantidadTotal: 0,
        cantidadDisponible: 0,
        cantidadPrestada: 0,
        cantidadMantenimiento: 0,
        cantidadBaja: 0
      }
    );

    return tx.equipo.update({
      where: { id: equipmentId },
      data: {
        ...counts,
        estado: resolveEquipmentState(counts)
      },
      select: {
        id: true,
        cantidadDisponible: true,
        cantidadPrestada: true,
        cantidadMantenimiento: true,
        cantidadBaja: true,
        estado: true
      }
    });
  }
}

function calculateAdjustedCounts(
  equipment: {
    cantidadTotal: number;
    cantidadDisponible: number;
    cantidadPrestada: number;
    cantidadMantenimiento: number;
    cantidadBaja: number;
  },
  movementType: TipoMovimiento,
  quantity: number
) {
  if (movementType === TipoMovimiento.AJUSTE_POSITIVO) {
    return {
      ...equipment,
      cantidadTotal: equipment.cantidadTotal + quantity,
      cantidadDisponible: equipment.cantidadDisponible + quantity
    };
  }

  if (movementType === TipoMovimiento.BAJA) {
    return {
      ...equipment,
      cantidadDisponible: equipment.cantidadDisponible - quantity,
      cantidadBaja: equipment.cantidadBaja + quantity
    };
  }

  return {
    ...equipment,
    cantidadTotal: equipment.cantidadTotal - quantity,
    cantidadDisponible: equipment.cantidadDisponible - quantity
  };
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

function cleanOptionalIdentifier(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

function createEquipmentQrToken() {
  return `eq_${randomUUID().replace(/-/g, "")}`;
}

function normalizeScannedEquipmentCode(value?: string | null) {
  const cleaned = value?.trim();
  if (!cleaned) {
    return null;
  }

  return cleaned
    .replace(/^SILAB-FCI:EQUIPO:/i, "")
    .replace(/^SILAB:EQ:/i, "")
    .trim();
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
