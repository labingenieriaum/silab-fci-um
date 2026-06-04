import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  EstadoCondicionEquipo,
  EstadoEquipo,
  EstadoPrestamo,
  TipoMovimiento,
  type Prisma
} from "@prisma/client";
import { getUserFacultyScope } from "../common/faculty-scope";
import type { JwtUser } from "../common/types/jwt-user";
import { PrismaService } from "../prisma/prisma.service";
import { ApproveLoanDto } from "./dto/approve-loan.dto";
import { CreateLoanDto } from "./dto/create-loan.dto";
import { DeliverLoanDto } from "./dto/deliver-loan.dto";
import { ListLoansQueryDto } from "./dto/list-loans-query.dto";
import { RegisterReturnDto } from "./dto/register-return.dto";
import { RejectLoanDto } from "./dto/reject-loan.dto";

type LoanTx = Prisma.TransactionClient;
type LoanActionDetail = {
  id: number;
  equipoId: number;
  equipoUnidadId: number | null;
  cantidadSolicitada: number;
  cantidadAprobada: number | null;
  cantidadEntregada: number;
  cantidadDevuelta: number;
};

const loanSelect = {
  id: true,
  codigo: true,
  usuarioSolicitanteId: true,
  materiaId: true,
  proyectoId: true,
  actividadId: true,
  aprobadoPorId: true,
  rechazadoPorId: true,
  entregadoPorId: true,
  tipoUso: true,
  fechaSolicitud: true,
  fechaPrestamo: true,
  fechaAprobacion: true,
  fechaRechazo: true,
  fechaEntrega: true,
  fechaDevolucionEstimada: true,
  fechaDevolucionReal: true,
  estado: true,
  observaciones: true,
  motivoRechazo: true,
  usuarioSolicitante: {
    select: {
      id: true,
      nombre: true,
      correo: true,
      documento: true
    }
  },
  aprobadoPor: {
    select: {
      id: true,
      nombre: true,
      correo: true
    }
  },
  rechazadoPor: {
    select: {
      id: true,
      nombre: true,
      correo: true
    }
  },
  entregadoPor: {
    select: {
      id: true,
      nombre: true,
      correo: true
    }
  },
  detalles: {
    select: {
      id: true,
      prestamoId: true,
      equipoId: true,
      equipoUnidadId: true,
      cantidadSolicitada: true,
      cantidadAprobada: true,
      cantidadEntregada: true,
      cantidadDevuelta: true,
      estadoEntrega: true,
      estadoDevolucion: true,
      observaciones: true,
      equipo: {
        select: {
          id: true,
          codigoInterno: true,
          nombre: true,
          requiereSerial: true,
          cantidadDisponible: true,
          cantidadPrestada: true,
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
      }
    },
    orderBy: {
      id: "asc"
    }
  },
  devoluciones: {
    select: {
      id: true,
      prestamoId: true,
      usuarioRecibeId: true,
      fechaDevolucion: true,
      observaciones: true,
      usuarioRecibe: {
        select: {
          id: true,
          nombre: true,
          correo: true
        }
      },
      detalles: {
        select: {
          id: true,
          prestamoDetalleId: true,
          equipoId: true,
          equipoUnidadId: true,
          cantidad: true,
          estadoDevolucion: true,
          observaciones: true
        }
      }
    },
    orderBy: {
      fechaDevolucion: "desc"
    }
  }
} satisfies Prisma.PrestamoSelect;

@Injectable()
export class LoansService {
  constructor(private readonly prisma: PrismaService) {}

  async findLoans(user: JwtUser, query: ListLoansQueryDto) {
    const scopedFacultyId = getUserFacultyScope(user);
    const where: Prisma.PrestamoWhereInput = {
      deletedAt: null,
      estado: query.estado,
      usuarioSolicitanteId: query.usuarioSolicitanteId,
      detalles: scopedFacultyId
        ? {
            some: {
              equipo: {
                ubicacion: {
                  laboratorio: {
                    facultadId: scopedFacultyId
                  }
                }
              }
            }
          }
        : undefined,
      OR: query.search
        ? [
            { codigo: { contains: query.search, mode: "insensitive" } },
            {
              usuarioSolicitante: {
                nombre: { contains: query.search, mode: "insensitive" }
              }
            },
            {
              usuarioSolicitante: {
                correo: { contains: query.search, mode: "insensitive" }
              }
            }
          ]
        : undefined
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.prestamo.findMany({
        where,
        select: loanSelect,
        orderBy: { fechaSolicitud: "desc" },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      }),
      this.prisma.prestamo.count({ where })
    ]);

    return {
      data,
      page: query.page,
      pageSize: query.pageSize,
      total
    };
  }

  async findLoanById(user: JwtUser, id: number) {
    const loan = await this.findLoanOrThrow(user, id);
    await this.markExpiredIfNeeded(loan.id, loan.estado, loan.fechaDevolucionEstimada);
    return this.findLoanOrThrow(user, id);
  }

  async createLoan(user: JwtUser, dto: CreateLoanDto) {
    const estimatedReturn = new Date(dto.fechaDevolucionEstimada);
    if (Number.isNaN(estimatedReturn.getTime()) || estimatedReturn <= new Date()) {
      throw new BadRequestException("La fecha estimada de devolucion debe ser futura.");
    }

    for (const detail of dto.detalles) {
      const equipment = await this.ensureEquipmentInScope(user, detail.equipoId);
      if (equipment.requiereSerial && !detail.equipoUnidadId) {
        throw new BadRequestException("El equipo serializado requiere seleccionar una unidad.");
      }
      if (!equipment.requiereSerial && detail.equipoUnidadId) {
        throw new BadRequestException("El equipo no serializado no debe incluir unidad.");
      }
      if (detail.equipoUnidadId) {
        await this.ensureUnitAvailable(user, detail.equipoId, detail.equipoUnidadId);
      }
      if (!equipment.requiereSerial && equipment.cantidadDisponible < detail.cantidadSolicitada) {
        throw new BadRequestException(
          `La cantidad solicitada supera la disponibilidad de ${equipment.nombre}.`
        );
      }
    }

    return this.prisma.prestamo.create({
      data: {
        usuarioSolicitanteId: user.sub,
        materiaId: dto.materiaId ?? null,
        proyectoId: dto.proyectoId ?? null,
        actividadId: dto.actividadId ?? null,
        tipoUso: dto.tipoUso,
        fechaDevolucionEstimada: estimatedReturn,
        observaciones: cleanNullableText(dto.observaciones),
        detalles: {
          create: dto.detalles.map((detail) => ({
            equipoId: detail.equipoId,
            equipoUnidadId: detail.equipoUnidadId ?? null,
            cantidadSolicitada: detail.equipoUnidadId ? 1 : detail.cantidadSolicitada,
            observaciones: cleanNullableText(detail.observaciones)
          }))
        }
      },
      select: loanSelect
    });
  }

  async approveLoan(user: JwtUser, id: number, dto: ApproveLoanDto) {
    const loan = await this.findLoanOrThrow(user, id);
    if (loan.estado !== EstadoPrestamo.SOLICITADO) {
      throw new BadRequestException("Solo se pueden aprobar prestamos solicitados.");
    }

    const approvalByDetail = new Map(
      (dto.detalles ?? []).map((detail) => [detail.prestamoDetalleId, detail.cantidadAprobada])
    );

    let approvedTotal = 0;
    for (const detail of loan.detalles) {
      const quantity = approvalByDetail.get(detail.id) ?? detail.cantidadSolicitada;
      if (quantity > detail.cantidadSolicitada) {
        throw new BadRequestException("La cantidad aprobada no puede superar la solicitada.");
      }
      if (quantity > 0) {
        await this.ensureEquipmentAvailableForQuantity(
          user,
          detail.equipoId,
          detail.equipoUnidadId,
          quantity
        );
      }
      approvedTotal += quantity;
    }

    if (approvedTotal < 1) {
      throw new BadRequestException("Debe aprobar al menos un item del prestamo.");
    }

    return this.prisma.$transaction(async (tx) => {
      for (const detail of loan.detalles) {
        await tx.prestamoDetalle.update({
          where: { id: detail.id },
          data: {
            cantidadAprobada: approvalByDetail.get(detail.id) ?? detail.cantidadSolicitada
          }
        });
      }

      return tx.prestamo.update({
        where: { id },
        data: {
          estado: EstadoPrestamo.APROBADO,
          aprobadoPorId: user.sub,
          fechaAprobacion: new Date()
        },
        select: loanSelect
      });
    });
  }

  async rejectLoan(user: JwtUser, id: number, dto: RejectLoanDto) {
    const loan = await this.findLoanOrThrow(user, id);
    if (loan.estado !== EstadoPrestamo.SOLICITADO) {
      throw new BadRequestException("Solo se pueden rechazar prestamos solicitados.");
    }

    return this.prisma.prestamo.update({
      where: { id },
      data: {
        estado: EstadoPrestamo.RECHAZADO,
        rechazadoPorId: user.sub,
        fechaRechazo: new Date(),
        motivoRechazo: dto.motivoRechazo.trim()
      },
      select: loanSelect
    });
  }

  async deliverLoan(user: JwtUser, id: number, dto: DeliverLoanDto) {
    const loan = await this.findLoanOrThrow(user, id);
    if (loan.estado !== EstadoPrestamo.APROBADO) {
      throw new BadRequestException("Solo se pueden entregar prestamos aprobados.");
    }

    const deliveryByDetail = new Map(
      (dto.detalles ?? []).map((detail) => [
        detail.prestamoDetalleId,
        {
          cantidadEntregada: detail.cantidadEntregada,
          estadoEntrega: detail.estadoEntrega ?? EstadoCondicionEquipo.BUENO
        }
      ])
    );

    return this.prisma.$transaction(async (tx) => {
      for (const detail of loan.detalles) {
        const approved = detail.cantidadAprobada ?? 0;
        if (approved < 1) {
          continue;
        }

        const delivery = deliveryByDetail.get(detail.id);
        const quantity = delivery?.cantidadEntregada ?? approved;
        if (quantity > approved) {
          throw new BadRequestException("La cantidad entregada no puede superar la aprobada.");
        }

        await this.moveDetailToLoaned(tx, user, id, detail, quantity);
        await tx.prestamoDetalle.update({
          where: { id: detail.id },
          data: {
            cantidadEntregada: quantity,
            estadoEntrega: delivery?.estadoEntrega ?? EstadoCondicionEquipo.BUENO
          }
        });
      }

      return tx.prestamo.update({
        where: { id },
        data: {
          estado: EstadoPrestamo.ENTREGADO,
          entregadoPorId: user.sub,
          fechaPrestamo: new Date(),
          fechaEntrega: new Date()
        },
        select: loanSelect
      });
    });
  }

  async registerReturn(user: JwtUser, id: number, dto: RegisterReturnDto) {
    const loan = await this.findLoanOrThrow(user, id);
    if (
      !([
        EstadoPrestamo.ENTREGADO,
        EstadoPrestamo.DEVUELTO_PARCIAL,
        EstadoPrestamo.VENCIDO
      ] as EstadoPrestamo[]).includes(loan.estado)
    ) {
      throw new BadRequestException("Solo se pueden devolver prestamos entregados.");
    }

    const detailsById = new Map(loan.detalles.map((detail) => [detail.id, detail]));

    return this.prisma.$transaction(async (tx) => {
      const returnRecord = await tx.devolucion.create({
        data: {
          prestamoId: id,
          usuarioRecibeId: user.sub,
          observaciones: cleanNullableText(dto.observaciones)
        },
        select: {
          id: true
        }
      });

      for (const returnDetail of dto.detalles) {
        const detail = detailsById.get(returnDetail.prestamoDetalleId);
        if (!detail) {
          throw new BadRequestException("El detalle de devolucion no pertenece al prestamo.");
        }

        const pending = detail.cantidadEntregada - detail.cantidadDevuelta;
        if (returnDetail.cantidad > pending) {
          throw new BadRequestException("La cantidad devuelta supera lo pendiente.");
        }

        await tx.devolucionDetalle.create({
          data: {
            devolucionId: returnRecord.id,
            prestamoDetalleId: detail.id,
            equipoId: detail.equipoId,
            equipoUnidadId: detail.equipoUnidadId,
            cantidad: returnDetail.cantidad,
            estadoDevolucion: returnDetail.estadoDevolucion,
            observaciones: cleanNullableText(returnDetail.observaciones)
          }
        });

        await this.moveDetailFromLoaned(
          tx,
          user,
          id,
          returnRecord.id,
          detail,
          returnDetail.cantidad,
          returnDetail.estadoDevolucion
        );

        await tx.prestamoDetalle.update({
          where: { id: detail.id },
          data: {
            cantidadDevuelta: { increment: returnDetail.cantidad },
            estadoDevolucion: returnDetail.estadoDevolucion
          }
        });
      }

      const refreshedDetails = await tx.prestamoDetalle.findMany({
        where: { prestamoId: id },
        select: {
          cantidadEntregada: true,
          cantidadDevuelta: true
        }
      });

      const completed = refreshedDetails.every(
        (detail) => detail.cantidadEntregada <= detail.cantidadDevuelta
      );

      return tx.prestamo.update({
        where: { id },
        data: {
          estado: completed ? EstadoPrestamo.DEVUELTO : EstadoPrestamo.DEVUELTO_PARCIAL,
          fechaDevolucionReal: completed ? new Date() : undefined
        },
        select: loanSelect
      });
    });
  }

  async findReturns(user: JwtUser, loanId?: number) {
    const scopedFacultyId = getUserFacultyScope(user);
    return this.prisma.devolucion.findMany({
      where: {
        prestamoId: loanId,
        prestamo: scopedFacultyId
          ? {
              detalles: {
                some: {
                  equipo: {
                    ubicacion: {
                      laboratorio: {
                        facultadId: scopedFacultyId
                      }
                    }
                  }
                }
              }
            }
          : undefined
      },
      select: loanSelect.devoluciones.select,
      orderBy: {
        fechaDevolucion: "desc"
      }
    });
  }

  private async findLoanOrThrow(user: JwtUser, id: number) {
    const scopedFacultyId = getUserFacultyScope(user);
    const loan = await this.prisma.prestamo.findFirst({
      where: {
        id,
        deletedAt: null,
        detalles: scopedFacultyId
          ? {
              some: {
                equipo: {
                  ubicacion: {
                    laboratorio: {
                      facultadId: scopedFacultyId
                    }
                  }
                }
              }
            }
          : undefined
      },
      select: loanSelect
    });

    if (!loan) {
      throw new NotFoundException("Prestamo no encontrado.");
    }

    return loan;
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
        nombre: true,
        requiereSerial: true,
        cantidadDisponible: true
      }
    });

    if (!equipment) {
      throw new BadRequestException("El equipo indicado no existe o no pertenece a tu facultad.");
    }

    return equipment;
  }

  private async ensureUnitAvailable(user: JwtUser, equipmentId: number, unitId: number) {
    const scopedFacultyId = getUserFacultyScope(user);
    const unit = await this.prisma.equipoUnidad.findFirst({
      where: {
        id: unitId,
        equipoId: equipmentId,
        deletedAt: null,
        estado: EstadoEquipo.DISPONIBLE,
        equipo: {
          ubicacion: {
            laboratorio: {
              facultadId: scopedFacultyId
            }
          }
        }
      },
      select: {
        id: true
      }
    });

    if (!unit) {
      throw new BadRequestException("La unidad indicada no esta disponible.");
    }
  }

  private async ensureEquipmentAvailableForQuantity(
    user: JwtUser,
    equipmentId: number,
    unitId: number | null,
    quantity: number
  ) {
    if (unitId) {
      await this.ensureUnitAvailable(user, equipmentId, unitId);
      return;
    }

    const equipment = await this.ensureEquipmentInScope(user, equipmentId);
    if (equipment.cantidadDisponible < quantity) {
      throw new BadRequestException(
        `La cantidad aprobada supera la disponibilidad de ${equipment.nombre}.`
      );
    }
  }

  private async moveDetailToLoaned(
    tx: LoanTx,
    user: JwtUser,
    loanId: number,
    detail: LoanActionDetail,
    quantity: number
  ) {
    const equipment = await tx.equipo.findUniqueOrThrow({
      where: { id: detail.equipoId },
      select: {
        id: true,
        ubicacionId: true,
        cantidadDisponible: true,
        cantidadPrestada: true
      }
    });

    if (equipment.cantidadDisponible < quantity) {
      throw new BadRequestException("La cantidad a entregar supera el inventario disponible.");
    }

    if (detail.equipoUnidadId) {
      const unit = await tx.equipoUnidad.findUniqueOrThrow({
        where: { id: detail.equipoUnidadId },
        select: {
          estado: true,
          ubicacionId: true
        }
      });
      if (unit.estado !== EstadoEquipo.DISPONIBLE) {
        throw new BadRequestException("La unidad a entregar no esta disponible.");
      }
      await tx.equipoUnidad.update({
        where: { id: detail.equipoUnidadId },
        data: {
          estado: EstadoEquipo.PRESTADO
        }
      });
    }

    const updated = await tx.equipo.update({
      where: { id: detail.equipoId },
      data: {
        cantidadDisponible: { decrement: quantity },
        cantidadPrestada: { increment: quantity },
        estado: EstadoEquipo.PRESTADO
      },
      select: {
        cantidadDisponible: true
      }
    });

    await tx.inventarioMovimiento.create({
      data: {
        equipoId: detail.equipoId,
        equipoUnidadId: detail.equipoUnidadId,
        usuarioId: user.sub,
        prestamoId: loanId,
        ubicacionOrigenId: equipment.ubicacionId,
        tipoMovimiento: TipoMovimiento.PRESTAMO,
        cantidad: quantity,
        cantidadAnterior: equipment.cantidadDisponible,
        cantidadNueva: updated.cantidadDisponible,
        descripcion: "Entrega de prestamo"
      }
    });
  }

  private async moveDetailFromLoaned(
    tx: LoanTx,
    user: JwtUser,
    loanId: number,
    returnId: number,
    detail: LoanActionDetail,
    quantity: number,
    condition: EstadoCondicionEquipo
  ) {
    const equipment = await tx.equipo.findUniqueOrThrow({
      where: { id: detail.equipoId },
      select: {
        id: true,
        ubicacionId: true,
        cantidadDisponible: true,
        cantidadPrestada: true
      }
    });

    const isUsable = ([
      EstadoCondicionEquipo.BUENO,
      EstadoCondicionEquipo.REGULAR,
      EstadoCondicionEquipo.NO_APLICA
    ] as EstadoCondicionEquipo[]).includes(condition);
    const isLost = condition === EstadoCondicionEquipo.PERDIDO;

    if (detail.equipoUnidadId) {
      await tx.equipoUnidad.update({
        where: { id: detail.equipoUnidadId },
        data: {
          estado: isUsable
            ? EstadoEquipo.DISPONIBLE
            : isLost
              ? EstadoEquipo.PERDIDO
              : EstadoEquipo.DANADO
        }
      });
    }

    const updated = await tx.equipo.update({
      where: { id: detail.equipoId },
      data: {
        cantidadDisponible: isUsable ? { increment: quantity } : undefined,
        cantidadPrestada: { decrement: quantity },
        cantidadMantenimiento: !isUsable && !isLost ? { increment: quantity } : undefined,
        cantidadBaja: isLost ? { increment: quantity } : undefined
      },
      select: {
        cantidadDisponible: true,
        cantidadPrestada: true,
        cantidadMantenimiento: true,
        cantidadBaja: true
      }
    });

    await tx.equipo.update({
      where: { id: detail.equipoId },
      data: {
        estado: resolveEquipmentState(updated)
      }
    });

    await tx.inventarioMovimiento.create({
      data: {
        equipoId: detail.equipoId,
        equipoUnidadId: detail.equipoUnidadId,
        usuarioId: user.sub,
        prestamoId: loanId,
        devolucionId: returnId,
        ubicacionDestinoId: equipment.ubicacionId,
        tipoMovimiento: TipoMovimiento.DEVOLUCION,
        cantidad: quantity,
        cantidadAnterior: equipment.cantidadDisponible,
        cantidadNueva: updated.cantidadDisponible,
        descripcion: `Devolucion de prestamo (${condition})`
      }
    });
  }

  private async markExpiredIfNeeded(
    id: number,
    status: EstadoPrestamo,
    estimatedReturn: Date
  ) {
    if (
      ([EstadoPrestamo.ENTREGADO, EstadoPrestamo.DEVUELTO_PARCIAL] as EstadoPrestamo[]).includes(
        status
      ) &&
      estimatedReturn < new Date()
    ) {
      await this.prisma.prestamo.update({
        where: { id },
        data: { estado: EstadoPrestamo.VENCIDO }
      });
    }
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
