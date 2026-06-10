import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  EstadoCondicionEquipo,
  EstadoEquipo,
  EstadoPrestamo,
  EstadoSolicitudPublicaPrestamo,
  RolPersonaPrestamo,
  TipoEvidenciaDevolucion,
  TipoEvidenciaPrestamo,
  TipoMovimiento,
  TipoUso,
  type Prisma
} from "@prisma/client";
import { getUserFacultyScope } from "../common/faculty-scope";
import type { JwtUser } from "../common/types/jwt-user";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";
import { defaultEmailTemplates } from "../settings/settings.service";
import { ApproveLoanDto } from "./dto/approve-loan.dto";
import { CreateLoanDto } from "./dto/create-loan.dto";
import { CreatePublicLoanRequestDto } from "./dto/create-public-loan-request.dto";
import { DeliverLoanDto } from "./dto/deliver-loan.dto";
import { ListLoansQueryDto } from "./dto/list-loans-query.dto";
import { RegisterReturnDto } from "./dto/register-return.dto";
import { RejectLoanDto } from "./dto/reject-loan.dto";
import { SendReturnActEmailDto } from "./dto/send-return-act-email.dto";
import { UpdatePublicLoanRequestDto } from "./dto/update-public-loan-request.dto";

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

type LoanAcademicContextInput = Pick<
  CreateLoanDto,
  "tipoUso" | "materiaId" | "materiaProfesorId" | "proyectoId" | "actividadId"
>;

type PublicLoanRequestForConversion = {
  id: number;
  codigoSolicitud: string;
  equipoId: number | null;
  prestamoConvertidoId: number | null;
  nombreCompleto: string;
  correoInstitucional: string;
  codigoRecurso: string;
  fechaPrestamo: Date;
  fechaDevolucionEstimada: Date;
  descripcionActividad: string;
  equipo: {
    id: number;
    codigoInterno: string;
    nombre: string;
  } | null;
};

const loanSelect = {
  id: true,
  codigo: true,
  usuarioSolicitanteId: true,
  personaSolicitanteId: true,
  materiaId: true,
  materiaProfesorId: true,
  proyectoId: true,
  actividadId: true,
  aprobadoPorId: true,
  rechazadoPorId: true,
  entregadoPorId: true,
  tipoUso: true,
  fechaSolicitud: true,
  fechaRequerida: true,
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
  personaSolicitante: {
    select: {
      id: true,
      codigo: true,
      nombre: true,
      correoInstitucional: true,
      carrera: true,
      semestre: true,
      rol: true,
      activo: true
    }
  },
  solicitanteNombre: true,
  solicitanteCorreo: true,
  solicitanteDocumento: true,
  materia: {
    select: {
      id: true,
      codigo: true,
      nombre: true,
      semestre: true,
      programa: {
        select: {
          id: true,
          nombre: true,
          codigo: true
        }
      }
    }
  },
  materiaProfesor: {
    select: {
      id: true,
      grupo: true,
      periodo: true,
      profesor: {
        select: {
          id: true,
          nombre: true,
          correo: true
        }
      }
    }
  },
  proyecto: {
    select: {
      id: true,
      nombre: true,
      tipo: true,
      semillero: {
        select: {
          id: true,
          nombre: true,
          codigo: true
        }
      }
    }
  },
  actividad: {
    select: {
      id: true,
      nombre: true,
      tipo: true,
      semillero: {
        select: {
          id: true,
          nombre: true,
          codigo: true
        }
      }
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
  },
  evidencias: {
    select: {
      id: true,
      prestamoId: true,
      tipo: true,
      nombreArchivo: true,
      mimeType: true,
      contenidoBase64: true,
      firmanteNombre: true,
      createdAt: true
    },
    orderBy: {
      id: "asc"
    }
  }
} satisfies Prisma.PrestamoSelect;

@Injectable()
export class LoansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService
  ) {}

  async findPublicLoanResources(search?: string) {
    const normalizedSearch = search?.trim();
    return this.prisma.equipo.findMany({
      where: {
        deletedAt: null,
        cantidadDisponible: { gt: 0 },
        estado: EstadoEquipo.DISPONIBLE,
        OR: normalizedSearch
          ? [
              { nombre: { contains: normalizedSearch, mode: "insensitive" } },
              { codigoInterno: { contains: normalizedSearch, mode: "insensitive" } },
              { codigoBarras: { contains: normalizedSearch, mode: "insensitive" } },
              { categoria: { nombre: { contains: normalizedSearch, mode: "insensitive" } } }
            ]
          : undefined
      },
      select: {
        id: true,
        codigoInterno: true,
        nombre: true,
        cantidadDisponible: true,
        requiereSerial: true,
        categoria: {
          select: {
            nombre: true
          }
        },
        ubicacion: {
          select: {
            nombre: true,
            laboratorio: {
              select: {
                codigo: true,
                nombre: true
              }
            }
          }
        }
      },
      orderBy: [{ nombre: "asc" }, { codigoInterno: "asc" }],
      take: 80
    });
  }

  async findPublicLoanPrograms() {
    return this.prisma.programa.findMany({
      where: {
        deletedAt: null
      },
      orderBy: [{ nombre: "asc" }, { codigo: "asc" }],
      select: {
        id: true,
        codigo: true,
        nombre: true,
        facultad: {
          select: {
            sigla: true,
            nombre: true
          }
        }
      }
    });
  }

  async createPublicLoanRequest(dto: CreatePublicLoanRequestDto) {
    const loanDate = parseRequestedDate(dto.fechaPrestamo);
    const returnDate = parseRequestedDate(dto.fechaDevolucionEstimada);
    const today = startOfDay(new Date());

    if (loanDate < today) {
      throw new BadRequestException("La fecha de prestamo no puede ser anterior a hoy.");
    }
    if (returnDate < loanDate) {
      throw new BadRequestException("La fecha de devolucion debe ser igual o posterior a la fecha de prestamo.");
    }

    const days = differenceInLoanDays(loanDate, returnDate);
    const requestedResource = await this.resolvePublicRequestedResource(dto);
    const applicant = await normalizePublicApplicantDetails(this.prisma, dto);
    const request = await this.prisma.solicitudPublicaPrestamo.create({
      data: {
        codigoSolicitud: createPublicRequestCode(),
        equipoId: requestedResource.equipoId,
        nombreCompleto: cleanRequiredText(dto.nombreCompleto),
        correoInstitucional: dto.correoInstitucional.trim().toLowerCase(),
        rolSolicitante: applicant.rolSolicitante,
        identificacion: applicant.identificacion,
        programa: applicant.programa,
        semestre: applicant.semestre,
        materia: applicant.materia,
        dependencia: applicant.dependencia,
        codigoRecurso: requestedResource.label,
        fechaPrestamo: loanDate,
        fechaDevolucionEstimada: returnDate,
        diasPrestamo: days,
        descripcionActividad: cleanRequiredText(dto.descripcionActividad)
      },
      select: {
        id: true,
        codigoSolicitud: true,
        equipoId: true,
        prestamoConvertidoId: true,
        nombreCompleto: true,
        correoInstitucional: true,
        rolSolicitante: true,
        identificacion: true,
        programa: true,
        semestre: true,
        materia: true,
        dependencia: true,
        codigoRecurso: true,
        fechaPrestamo: true,
        fechaDevolucionEstimada: true,
        diasPrestamo: true,
        descripcionActividad: true,
        estado: true,
        createdAt: true
      }
    });

    return request;
  }

  private async resolvePublicRequestedResource(dto: CreatePublicLoanRequestDto) {
    if (!dto.equipoId) {
      return {
        equipoId: null,
        label: cleanRequiredText(dto.codigo)
      };
    }

    const equipment = await this.prisma.equipo.findFirst({
      where: {
        id: dto.equipoId,
        deletedAt: null,
        cantidadDisponible: { gt: 0 },
        estado: EstadoEquipo.DISPONIBLE
      },
      select: {
        id: true,
        codigoInterno: true,
        nombre: true
      }
    });

    if (!equipment) {
      throw new BadRequestException("El equipo seleccionado ya no esta disponible para prestamo.");
    }

    return {
      equipoId: equipment.id,
      label: `${equipment.codigoInterno} - ${equipment.nombre}`
    };
  }

  async findPublicLoanRequests(user: JwtUser) {
    const scopedFacultyId = getUserFacultyScope(user);
    return this.prisma.solicitudPublicaPrestamo.findMany({
      where: {
        deletedAt: null,
        OR: scopedFacultyId
          ? [
              { equipoId: null },
              {
                equipo: {
                  ubicacion: {
                    laboratorio: {
                      facultadId: scopedFacultyId
                    }
                  }
                }
              }
            ]
          : undefined
      },
      select: {
        id: true,
        codigoSolicitud: true,
        equipoId: true,
        nombreCompleto: true,
        correoInstitucional: true,
        rolSolicitante: true,
        identificacion: true,
        programa: true,
        semestre: true,
        materia: true,
        dependencia: true,
        codigoRecurso: true,
        fechaPrestamo: true,
        fechaDevolucionEstimada: true,
        diasPrestamo: true,
        descripcionActividad: true,
        estado: true,
        observacionesInternas: true,
        createdAt: true,
        equipo: {
          select: {
            codigoInterno: true,
            nombre: true,
            cantidadDisponible: true
          }
        },
        prestamoConvertido: {
          select: {
            id: true,
            codigo: true,
            estado: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });
  }

  async updatePublicLoanRequest(user: JwtUser, id: number, dto: UpdatePublicLoanRequestDto) {
    const scopedFacultyId = getUserFacultyScope(user);
    const request = await this.prisma.solicitudPublicaPrestamo.findFirst({
      where: {
        id,
        deletedAt: null,
        OR: scopedFacultyId
          ? [
              { equipoId: null },
              {
                equipo: {
                  ubicacion: {
                    laboratorio: {
                      facultadId: scopedFacultyId
                    }
                  }
                }
              }
            ]
          : undefined
      },
      select: {
        id: true,
        codigoSolicitud: true,
        equipoId: true,
        prestamoConvertidoId: true,
        nombreCompleto: true,
        correoInstitucional: true,
        codigoRecurso: true,
        fechaPrestamo: true,
        fechaDevolucionEstimada: true,
        descripcionActividad: true,
        equipo: {
          select: {
            id: true,
            codigoInterno: true,
            nombre: true
          }
        }
      }
    });

    if (!request) {
      throw new NotFoundException("Solicitud publica no encontrada.");
    }

    const note = cleanNullableText(dto.observacionesInternas);
    if (dto.estado === EstadoSolicitudPublicaPrestamo.RECHAZADA && !note) {
      throw new BadRequestException("Para rechazar la solicitud debes registrar una nota.");
    }

    if (dto.estado === EstadoSolicitudPublicaPrestamo.CONVERTIDA) {
      return this.convertPublicLoanRequestToLoan(user, request, dto, note);
    }

    const updated = await this.prisma.solicitudPublicaPrestamo.update({
      where: { id },
      data: {
        estado: dto.estado,
        observacionesInternas: note
      }
    });

    return updated;
  }

  private async convertPublicLoanRequestToLoan(
    user: JwtUser,
    request: PublicLoanRequestForConversion,
    dto: UpdatePublicLoanRequestDto,
    note: string | null
  ) {
    if (request.prestamoConvertidoId) {
      throw new BadRequestException("Esta solicitud publica ya fue convertida a prestamo.");
    }

    const equipmentId = dto.equipoId ?? request.equipoId;
    if (!equipmentId) {
      throw new BadRequestException("Selecciona un equipo para convertir la solicitud en prestamo real.");
    }

    const requiredDate = dto.fechaPrestamo ? new Date(dto.fechaPrestamo) : request.fechaPrestamo;
    const estimatedReturn = dto.fechaDevolucionEstimada
      ? new Date(dto.fechaDevolucionEstimada)
      : request.fechaDevolucionEstimada;

    if (Number.isNaN(requiredDate.getTime())) {
      throw new BadRequestException("La fecha de prestamo es invalida.");
    }
    if (Number.isNaN(estimatedReturn.getTime()) || estimatedReturn <= requiredDate) {
      throw new BadRequestException("La devolucion estimada debe ser posterior a la fecha de prestamo.");
    }
    if (requiredDate < new Date()) {
      throw new BadRequestException("La fecha de prestamo no puede ser anterior al momento actual.");
    }

    const equipment = await this.ensureEquipmentInScope(user, equipmentId);
    const unitId = dto.equipoUnidadId ?? null;
    const quantity = equipment.requiereSerial ? 1 : dto.cantidadAprobada ?? 1;

    if (equipment.requiereSerial && !unitId) {
      throw new BadRequestException("El equipo serializado requiere seleccionar una unidad para aprobar.");
    }
    if (!equipment.requiereSerial && unitId) {
      throw new BadRequestException("El equipo no serializado no debe incluir unidad.");
    }
    await this.ensureEquipmentAvailableForQuantity(user, equipmentId, unitId, quantity);

    const tipoUso = dto.tipoUso ?? TipoUso.OTRO;
    const academicContext = await this.resolveLoanAcademicContext(user, {
      tipoUso,
      materiaId: dto.materiaId,
      materiaProfesorId: dto.materiaProfesorId,
      proyectoId: dto.proyectoId,
      actividadId: dto.actividadId
    });

    const converted = await this.prisma.$transaction(async (tx) => {
      const loan = await tx.prestamo.create({
        data: {
          solicitanteNombre: cleanRequiredText(request.nombreCompleto),
          solicitanteCorreo: request.correoInstitucional.trim().toLowerCase(),
          solicitanteDocumento: null,
          materiaId: academicContext.materiaId,
          materiaProfesorId: academicContext.materiaProfesorId,
          proyectoId: academicContext.proyectoId,
          actividadId: academicContext.actividadId,
          tipoUso,
          fechaRequerida: requiredDate,
          fechaDevolucionEstimada: estimatedReturn,
          estado: EstadoPrestamo.APROBADO,
          aprobadoPorId: user.sub,
          fechaAprobacion: new Date(),
          observaciones: [
            `Solicitud publica ${request.codigoSolicitud}`,
            request.descripcionActividad,
            note ? `Nota interna: ${note}` : ""
          ]
            .filter(Boolean)
            .join("\n"),
          detalles: {
            create: {
              equipoId: equipmentId,
              equipoUnidadId: unitId,
              cantidadSolicitada: quantity,
              cantidadAprobada: quantity,
              observaciones: request.codigoRecurso
            }
          }
        },
        select: {
          id: true,
          codigo: true,
          estado: true
        }
      });

      return tx.solicitudPublicaPrestamo.update({
        where: { id: request.id },
        data: {
          estado: EstadoSolicitudPublicaPrestamo.CONVERTIDA,
          observacionesInternas: note,
          prestamoConvertidoId: loan.id,
          equipoId: equipmentId,
          codigoRecurso: `${equipment.codigoInterno} - ${equipment.nombre}`,
          fechaPrestamo: requiredDate,
          fechaDevolucionEstimada: estimatedReturn,
          diasPrestamo: differenceInLoanDays(startOfDay(requiredDate), startOfDay(estimatedReturn))
        },
        select: {
          id: true,
          codigoSolicitud: true,
          equipoId: true,
          prestamoConvertidoId: true,
          nombreCompleto: true,
          correoInstitucional: true,
          codigoRecurso: true,
          fechaPrestamo: true,
          fechaDevolucionEstimada: true,
          diasPrestamo: true,
          descripcionActividad: true,
          estado: true,
          observacionesInternas: true,
          createdAt: true,
          equipo: {
            select: {
              codigoInterno: true,
              nombre: true,
              cantidadDisponible: true
            }
          },
          prestamoConvertido: {
            select: {
              id: true,
              codigo: true,
              estado: true
            }
          }
        }
      });
    });

    const templates = await this.getEmailTemplates();
    const template = templates.publicLoanApproved ?? defaultEmailTemplates.publicLoanApproved;
    const values = {
      name: request.nombreCompleto,
      requestCode: request.codigoSolicitud,
      loanCode: converted.prestamoConvertido?.codigo ?? "",
      returnId: "",
      extraMessage: note ?? ""
    };
    await this.mailService.sendMail({
      to: request.correoInstitucional,
      subject: renderTemplate(template.subject, values),
      html: renderTemplate(template.body, values)
    });

    return converted;
  }

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
            },
            {
              personaSolicitante: {
                nombre: { contains: query.search, mode: "insensitive" }
              }
            },
            {
              personaSolicitante: {
                codigo: { contains: query.search, mode: "insensitive" }
              }
            },
            {
              personaSolicitante: {
                correoInstitucional: { contains: query.search, mode: "insensitive" }
              }
            },
            { solicitanteNombre: { contains: query.search, mode: "insensitive" } },
            { solicitanteCorreo: { contains: query.search, mode: "insensitive" } },
            { solicitanteDocumento: { contains: query.search, mode: "insensitive" } }
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

  async findLoanDeliveryAct(user: JwtUser, id: number) {
    const loan = await this.findLoanOrThrow(user, id);
    if (!loan.evidencias.length) {
      throw new NotFoundException("Acta de entrega no encontrada para este prestamo.");
    }
    return loan;
  }

  async createLoan(user: JwtUser, dto: CreateLoanDto) {
    const requester = await this.resolveLoanRequester(user, dto);
    const academicContext = await this.resolveLoanAcademicContext(user, dto);
    const requiredDate = new Date(dto.fechaRequerida);
    if (Number.isNaN(requiredDate.getTime())) {
      throw new BadRequestException("La fecha requerida del prestamo es invalida.");
    }
    if (requiredDate < new Date()) {
      throw new BadRequestException("La fecha requerida del prestamo no puede ser anterior al momento actual.");
    }
    const estimatedReturn = new Date(dto.fechaDevolucionEstimada);
    if (Number.isNaN(estimatedReturn.getTime()) || estimatedReturn <= requiredDate) {
      throw new BadRequestException("La fecha estimada de devolucion debe ser posterior a la fecha requerida.");
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
        usuarioSolicitanteId: requester.usuarioSolicitanteId,
        personaSolicitanteId: requester.personaSolicitanteId,
        solicitanteNombre: requester.solicitanteNombre,
        solicitanteCorreo: requester.solicitanteCorreo,
        solicitanteDocumento: requester.solicitanteDocumento,
        materiaId: academicContext.materiaId,
        materiaProfesorId: academicContext.materiaProfesorId,
        proyectoId: academicContext.proyectoId,
        actividadId: academicContext.actividadId,
        tipoUso: dto.tipoUso,
        fechaRequerida: requiredDate,
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
    this.validateDeliveryEvidences(dto);

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
      await tx.prestamoEvidencia.createMany({
        data: dto.evidencias.map((evidence) => ({
          prestamoId: id,
          tipo: evidence.tipo,
          nombreArchivo: cleanNullableText(evidence.nombreArchivo),
          mimeType: evidence.mimeType,
          contenidoBase64: evidence.contenidoBase64,
          firmanteNombre: cleanNullableText(evidence.firmanteNombre)
        }))
      });

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
    this.validateReturnEvidences(dto);

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

      await tx.devolucionEvidencia.createMany({
        data: dto.evidencias.map((evidence) => ({
          devolucionId: returnRecord.id,
          tipo: evidence.tipo,
          nombreArchivo: cleanNullableText(evidence.nombreArchivo),
          mimeType: evidence.mimeType,
          contenidoBase64: evidence.contenidoBase64,
          firmanteNombre: cleanNullableText(evidence.firmanteNombre)
        }))
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

      const updatedLoan = await tx.prestamo.update({
        where: { id },
        data: {
          estado: completed ? EstadoPrestamo.DEVUELTO : EstadoPrestamo.DEVUELTO_PARCIAL,
          fechaDevolucionReal: completed ? new Date() : undefined
        },
        select: loanSelect
      });

      return {
        loan: updatedLoan,
        returnId: returnRecord.id
      };
    });
  }

  async findReturnAct(user: JwtUser, id: number) {
    const scopedFacultyId = getUserFacultyScope(user);
    const returnRecord = await this.prisma.devolucion.findFirst({
      where: {
        id,
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
      select: {
        id: true,
        fechaDevolucion: true,
        observaciones: true,
        usuarioRecibe: {
          select: {
            nombre: true,
            correo: true
          }
        },
        prestamo: {
          select: {
            id: true,
            codigo: true,
            estado: true,
            solicitanteNombre: true,
            solicitanteCorreo: true,
            solicitanteDocumento: true,
            personaSolicitante: {
              select: {
                codigo: true,
                nombre: true,
                correoInstitucional: true,
                carrera: true,
                semestre: true,
                rol: true
              }
            },
            fechaSolicitud: true,
            fechaDevolucionEstimada: true,
            usuarioSolicitante: {
              select: {
                nombre: true,
                correo: true,
                documento: true
              }
            }
          }
        },
        detalles: {
          select: {
            id: true,
            cantidad: true,
            estadoDevolucion: true,
            observaciones: true,
            equipo: {
              select: {
                codigoInterno: true,
                nombre: true
              }
            },
            equipoUnidad: {
              select: {
                codigoInterno: true,
                serial: true
              }
            }
          }
        },
        evidencias: {
          select: {
            id: true,
            tipo: true,
            nombreArchivo: true,
            mimeType: true,
            contenidoBase64: true,
            firmanteNombre: true,
            createdAt: true
          },
          orderBy: { id: "asc" }
        }
      }
    });

    if (!returnRecord) {
      throw new NotFoundException("Acta de devolucion no encontrada.");
    }

    return returnRecord;
  }

  async sendReturnActEmail(user: JwtUser, id: number, dto: SendReturnActEmailDto) {
    const act = await this.findReturnAct(user, id);
    const templates = await this.getEmailTemplates();
    const template = templates.returnAct ?? defaultEmailTemplates.returnAct;
    const requester = resolveRequesterForMail(act.prestamo);
    const values = {
      name: requester.name,
      returnId: String(act.id),
      loanCode: act.prestamo.codigo,
      extraMessage: dto.message ?? ""
    };

    await this.mailService.sendMail({
      to: dto.to ?? requester.email,
      subject: renderTemplate(template.subject, values),
      html: `${renderTemplate(template.body, values)}${renderReturnActSummary(act)}`
    });

    return { sent: true, to: dto.to ?? requester.email };
  }

  async sendLoanDueSoonEmail(user: JwtUser, id: number) {
    const loan = await this.findLoanOrThrow(user, id);
    const requester = resolveRequesterForMail(loan);
    const templates = await this.getEmailTemplates();
    const template = templates.loanDueSoon ?? defaultEmailTemplates.loanDueSoon;
    const values = {
      name: requester.name,
      loanCode: loan.codigo,
      returnId: "",
      requestCode: "",
      extraMessage: ""
    };

    await this.mailService.sendMail({
      to: requester.email,
      subject: renderTemplate(template.subject, values),
      html: renderTemplate(template.body, values)
    });

    return { sent: true, to: requester.email };
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
        codigoInterno: true,
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

  private async resolveLoanAcademicContext(user: JwtUser, dto: LoanAcademicContextInput) {
    const scopedFacultyId = getUserFacultyScope(user);
    let materiaId = dto.materiaId ?? null;
    const materiaProfesorId = dto.materiaProfesorId ?? null;

    if (materiaProfesorId) {
      const assignment = await this.prisma.materiaProfesor.findFirst({
        where: {
          id: materiaProfesorId,
          deletedAt: null,
          activo: true,
          materia: {
            deletedAt: null,
            programa: {
              facultadId: scopedFacultyId
            }
          }
        },
        select: {
          materiaId: true
        }
      });

      if (!assignment) {
        throw new BadRequestException("El grupo/profesor de la materia no existe o no pertenece a tu facultad.");
      }
      if (materiaId && materiaId !== assignment.materiaId) {
        throw new BadRequestException("La materia y el grupo/profesor seleccionados no coinciden.");
      }
      materiaId = assignment.materiaId;
    }

    if (materiaId) {
      const subject = await this.prisma.materia.findFirst({
        where: {
          id: materiaId,
          deletedAt: null,
          activa: true,
          programa: {
            facultadId: scopedFacultyId
          }
        },
        select: {
          id: true
        }
      });

      if (!subject) {
        throw new BadRequestException("La materia indicada no existe o no pertenece a tu facultad.");
      }
    }

    if (dto.tipoUso === "ACADEMICO" && !materiaId) {
      throw new BadRequestException("Selecciona la materia asociada al prestamo academico.");
    }

    if (dto.proyectoId) {
      const project = await this.prisma.proyecto.findFirst({
        where: {
          id: dto.proyectoId,
          deletedAt: null,
          activo: true,
          programa: {
            facultadId: scopedFacultyId
          }
        },
        select: {
          id: true
        }
      });

      if (!project) {
        throw new BadRequestException("El proyecto indicado no existe o no pertenece a tu facultad.");
      }
    }

    if (dto.actividadId) {
      const activity = await this.prisma.actividad.findFirst({
        where: {
          id: dto.actividadId,
          deletedAt: null,
          activa: true,
          facultadId: scopedFacultyId
        },
        select: {
          id: true
        }
      });

      if (!activity) {
        throw new BadRequestException("La actividad indicada no existe o no pertenece a tu facultad.");
      }
    }

    return {
      materiaId,
      materiaProfesorId,
      proyectoId: dto.proyectoId ?? null,
      actividadId: dto.actividadId ?? null
    };
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

  private validateReturnEvidences(dto: RegisterReturnDto) {
    const types = new Set(dto.evidencias.map((evidence) => evidence.tipo));
    if (!types.has(TipoEvidenciaDevolucion.FOTO)) {
      throw new BadRequestException("Debes adjuntar al menos una foto de los equipos devueltos.");
    }
    for (const type of [
      TipoEvidenciaDevolucion.FIRMA_COORDINADOR,
      TipoEvidenciaDevolucion.FIRMA_ADMIN,
      TipoEvidenciaDevolucion.FIRMA_SOLICITANTE
    ]) {
      if (!types.has(type)) {
        throw new BadRequestException("Debes registrar las firmas de coordinacion, administrador y solicitante.");
      }
    }

    for (const evidence of dto.evidencias) {
      const content = evidence.contenidoBase64.trim();
      if (!content.startsWith("data:")) {
        throw new BadRequestException("Las evidencias deben enviarse como data URL base64.");
      }
      if (content.length > 2_500_000) {
        throw new BadRequestException("Cada evidencia debe pesar menos de 2.5 MB.");
      }
      if (evidence.tipo === TipoEvidenciaDevolucion.FOTO && !evidence.mimeType.startsWith("image/")) {
        throw new BadRequestException("Las fotos de devolucion deben ser imagenes.");
      }
    }
  }

  private validateDeliveryEvidences(dto: DeliverLoanDto) {
    const types = new Set(dto.evidencias.map((evidence) => evidence.tipo));
    if (!types.has(TipoEvidenciaPrestamo.FOTO)) {
      throw new BadRequestException("Debes adjuntar al menos una foto de los equipos entregados.");
    }

    for (const type of [
      TipoEvidenciaPrestamo.FIRMA_COORDINADOR,
      TipoEvidenciaPrestamo.FIRMA_SOLICITANTE
    ]) {
      if (!types.has(type)) {
        throw new BadRequestException("Debes registrar las firmas de coordinacion y solicitante.");
      }
    }

    for (const evidence of dto.evidencias) {
      const content = evidence.contenidoBase64.trim();
      if (!content.startsWith("data:")) {
        throw new BadRequestException("Las evidencias de entrega deben enviarse como data URL base64.");
      }
      if (content.length > 2_500_000) {
        throw new BadRequestException("Cada evidencia debe pesar menos de 2.5 MB.");
      }
      if (evidence.tipo === TipoEvidenciaPrestamo.FOTO && !evidence.mimeType.startsWith("image/")) {
        throw new BadRequestException("Las fotos de entrega deben ser imagenes.");
      }
      if (evidence.tipo !== TipoEvidenciaPrestamo.FOTO && evidence.mimeType !== "image/png") {
        throw new BadRequestException("Las firmas de entrega deben registrarse en formato PNG.");
      }
    }
  }

  private async getEmailTemplates() {
    const record = await this.prisma.configuracionSistema.findUnique({
      where: { clave: "email.templates" }
    });
    return record
      ? { ...defaultEmailTemplates, ...JSON.parse(record.valor) }
      : defaultEmailTemplates;
  }

  private async trySendPublicApprovalEmail(
    request: { nombreCompleto: string; codigoSolicitud: string; correoInstitucional: string },
    note: string | null
  ) {
    try {
      const templates = await this.getEmailTemplates();
      const template = templates.publicLoanApproved ?? defaultEmailTemplates.publicLoanApproved;
      const values = {
        name: request.nombreCompleto,
        requestCode: request.codigoSolicitud,
        loanCode: "",
        returnId: "",
        extraMessage: note ?? ""
      };
      await this.mailService.sendMail({
        to: request.correoInstitucional,
        subject: renderTemplate(template.subject, values),
        html: renderTemplate(template.body, values)
      });
    } catch {
      // La aprobacion no debe bloquearse si SMTP aun no esta autorizado/configurado por TI.
    }
  }

  private async resolveLoanRequester(user: JwtUser, dto: CreateLoanDto) {
    if (dto.personaSolicitanteId) {
      const person = await this.prisma.personaPrestamo.findFirst({
        where: {
          id: dto.personaSolicitanteId,
          deletedAt: null,
          activo: true
        },
        select: {
          id: true
        }
      });

      if (!person) {
        throw new BadRequestException("La persona seleccionada no existe o no esta activa.");
      }

      return {
        personaSolicitanteId: person.id,
        usuarioSolicitanteId: null,
        solicitanteNombre: null,
        solicitanteCorreo: null,
        solicitanteDocumento: null
      };
    }

    if (dto.personaCodigo || dto.personaNombre || dto.personaCorreoInstitucional) {
      const codigo = cleanNullableText(dto.personaCodigo);
      const nombre = cleanNullableText(dto.personaNombre);
      const email = cleanNullableText(dto.personaCorreoInstitucional)?.toLowerCase() ?? null;
      const rol = dto.personaRol;
      if (!codigo || !nombre || !email || !rol) {
        throw new BadRequestException("Registra codigo, nombre, correo y rol de la persona.");
      }
      if (rol !== RolPersonaPrestamo.ESTUDIANTE && dto.personaSemestre) {
        throw new BadRequestException("El semestre solo aplica para estudiantes.");
      }
      const affiliation = await normalizeLoanPersonAffiliation(this.prisma, rol, dto.personaCarrera);

      const person = await this.prisma.personaPrestamo.upsert({
        where: { codigo },
        create: {
          codigo,
          nombre,
          correoInstitucional: email,
          carrera: affiliation,
          semestre: rol === RolPersonaPrestamo.ESTUDIANTE ? (dto.personaSemestre ?? null) : null,
          rol,
          activo: true
        },
        update: {
          nombre,
          correoInstitucional: email,
          carrera: affiliation,
          semestre: rol === RolPersonaPrestamo.ESTUDIANTE ? (dto.personaSemestre ?? null) : null,
          rol,
          activo: true,
          deletedAt: null
        },
        select: {
          id: true
        }
      });

      return {
        personaSolicitanteId: person.id,
        usuarioSolicitanteId: null,
        solicitanteNombre: null,
        solicitanteCorreo: null,
        solicitanteDocumento: null
      };
    }

    if (dto.usuarioSolicitanteId) {
      const scopedFacultyId = getUserFacultyScope(user);
      const requester = await this.prisma.usuario.findFirst({
        where: {
          id: dto.usuarioSolicitanteId,
          deletedAt: null,
          activo: true,
          facultadId: scopedFacultyId
        },
        select: {
          id: true
        }
      });

      if (!requester) {
        throw new BadRequestException("El solicitante seleccionado no existe o no esta activo.");
      }

      return {
        personaSolicitanteId: null,
        usuarioSolicitanteId: requester.id,
        solicitanteNombre: null,
        solicitanteCorreo: null,
        solicitanteDocumento: null
      };
    }

    const name = cleanNullableText(dto.solicitanteNombre);
    const email = cleanNullableText(dto.solicitanteCorreo)?.toLowerCase() ?? null;
    const document = cleanNullableText(dto.solicitanteDocumento);

    if (!name || !email || !document) {
      throw new BadRequestException("Registra nombre, correo y documento del solicitante manual.");
    }

    return {
      personaSolicitanteId: null,
      usuarioSolicitanteId: null,
      solicitanteNombre: name,
      solicitanteCorreo: email,
      solicitanteDocumento: document
    };
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

function cleanRequiredText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function parseRequestedDate(value: string) {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const date = dateOnlyMatch
    ? new Date(Number(dateOnlyMatch[1]), Number(dateOnlyMatch[2]) - 1, Number(dateOnlyMatch[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException("Fecha invalida.");
  }
  return startOfDay(date);
}

function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function differenceInLoanDays(start: Date, end: Date) {
  const day = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.floor((end.getTime() - start.getTime()) / day) + 1);
}

function createPublicRequestCode() {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const timePart = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PUB-PRE-${datePart}-${timePart}-${suffix}`;
}

function renderTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key] ?? "");
}

async function normalizePublicApplicantDetails(prisma: PrismaService, dto: CreatePublicLoanRequestDto) {
  const role = dto.rolSolicitante;
  const identificacion = cleanNullableText(dto.identificacion);
  if (!identificacion) {
    throw new BadRequestException(
      role === RolPersonaPrestamo.ESTUDIANTE
        ? "Para estudiantes el codigo estudiantil es obligatorio."
        : "La cedula del solicitante es obligatoria."
    );
  }

  if (role === RolPersonaPrestamo.ESTUDIANTE) {
    if (!dto.semestre) {
      throw new BadRequestException("Selecciona el semestre del estudiante.");
    }
    const program = await findProgramByNameOrCode(prisma, dto.programa);
    if (!program) {
      throw new BadRequestException("Selecciona una carrera/programa existente.");
    }
    return {
      rolSolicitante: role,
      identificacion,
      programa: program.nombre,
      semestre: dto.semestre,
      materia: null,
      dependencia: null
    };
  }

  if (role === RolPersonaPrestamo.PROFESOR) {
    const materia = cleanNullableText(dto.materia);
    if (!materia) {
      throw new BadRequestException("La materia es obligatoria para profesores.");
    }
    return {
      rolSolicitante: role,
      identificacion,
      programa: null,
      semestre: null,
      materia,
      dependencia: null
    };
  }

  const dependencia = cleanNullableText(dto.dependencia);
  if (!dependencia) {
    throw new BadRequestException("La dependencia es obligatoria para administrativos.");
  }
  return {
    rolSolicitante: role,
    identificacion,
    programa: null,
    semestre: null,
    materia: null,
    dependencia
  };
}

async function findProgramByNameOrCode(prisma: PrismaService, value?: string | null) {
  const cleaned = cleanNullableText(value);
  if (!cleaned) return null;
  const programs = await prisma.programa.findMany({
    where: { deletedAt: null },
    select: { nombre: true, codigo: true }
  });
  const normalized = normalizeCatalogText(cleaned);
  return (
    programs.find(
      (item) => normalizeCatalogText(item.nombre) === normalized || normalizeCatalogText(item.codigo) === normalized
    ) ?? null
  );
}

async function normalizeLoanPersonAffiliation(
  prisma: PrismaService,
  rol: RolPersonaPrestamo,
  value?: string | null
) {
  const cleaned = cleanNullableText(value);
  if (!cleaned) {
    throw new BadRequestException(loanPersonAffiliationRequiredMessage(rol));
  }

  if (rol === RolPersonaPrestamo.ESTUDIANTE) {
    const programs = await prisma.programa.findMany({
      where: { deletedAt: null },
      select: { nombre: true, codigo: true }
    });
    const normalized = normalizeCatalogText(cleaned);
    const program = programs.find(
      (item) => normalizeCatalogText(item.nombre) === normalized || normalizeCatalogText(item.codigo) === normalized
    );
    if (!program) {
      throw new BadRequestException("La carrera debe corresponder a un programa academico existente.");
    }
    return program.nombre;
  }

  if (rol === RolPersonaPrestamo.PROFESOR) {
    const faculties = await prisma.facultad.findMany({
      where: { deletedAt: null },
      select: { nombre: true, sigla: true }
    });
    const normalized = normalizeCatalogText(cleaned);
    const faculty = faculties.find(
      (item) => normalizeCatalogText(item.nombre) === normalized || normalizeCatalogText(item.sigla) === normalized
    );
    if (!faculty) {
      throw new BadRequestException("La facultad del profesor debe existir en el catalogo de facultades.");
    }
    return faculty.nombre;
  }

  return cleaned;
}

function loanPersonAffiliationRequiredMessage(rol: RolPersonaPrestamo) {
  if (rol === RolPersonaPrestamo.ESTUDIANTE) return "Selecciona el programa academico del estudiante.";
  if (rol === RolPersonaPrestamo.PROFESOR) return "Selecciona la facultad del profesor.";
  return "La dependencia del administrativo es obligatoria.";
}

function normalizeCatalogText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function renderReturnActSummary(act: Awaited<ReturnType<LoansService["findReturnAct"]>>) {
  const rows = act.detalles
    .map(
      (detail) =>
        `<tr><td>${escapeHtml(detail.equipo.codigoInterno)}</td><td>${escapeHtml(detail.equipo.nombre)}</td><td>${detail.cantidad}</td><td>${escapeHtml(detail.estadoDevolucion)}</td></tr>`
    )
    .join("");
  return `<hr><p><strong>Acta de devolucion:</strong> ${act.id}</p><p><strong>Recibido por:</strong> ${escapeHtml(act.usuarioRecibe.nombre)}</p><table border="1" cellpadding="6" cellspacing="0"><thead><tr><th>Codigo</th><th>Equipo</th><th>Cantidad</th><th>Condicion</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function resolveRequesterForMail(loan: {
  usuarioSolicitante?: { nombre: string; correo: string; documento?: string } | null;
  personaSolicitante?: {
    nombre: string;
    correoInstitucional?: string | null;
    codigo?: string | null;
  } | null;
  solicitanteNombre?: string | null;
  solicitanteCorreo?: string | null;
  solicitanteDocumento?: string | null;
}) {
  const email =
    loan.personaSolicitante?.correoInstitucional ??
    loan.usuarioSolicitante?.correo ??
    loan.solicitanteCorreo;
  if (!email) {
    throw new BadRequestException("El prestamo no tiene correo de solicitante para enviar notificaciones.");
  }
  return {
    name:
      loan.personaSolicitante?.nombre ??
      loan.usuarioSolicitante?.nombre ??
      loan.solicitanteNombre ??
      "Solicitante",
    email,
    document:
      loan.personaSolicitante?.codigo ??
      loan.usuarioSolicitante?.documento ??
      loan.solicitanteDocumento ??
      ""
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
