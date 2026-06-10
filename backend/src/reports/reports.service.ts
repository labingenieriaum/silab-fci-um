import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { getUserFacultyScope } from "../common/faculty-scope";
import type { JwtUser } from "../common/types/jwt-user";
import { PrismaService } from "../prisma/prisma.service";
import { createInventoryReportPdf, createPdfDocument, createTableReportPdf, createXlsxWorkbook } from "./report-file.utils";

const xlsxContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
const pdfContentType = "application/pdf";

const equipmentReportSelect = {
  id: true,
  codigoInterno: true,
  codigoBarras: true,
  nombre: true,
  marca: true,
  modelo: true,
  requiereSerial: true,
  cantidadTotal: true,
  cantidadDisponible: true,
  cantidadPrestada: true,
  cantidadMantenimiento: true,
  cantidadBaja: true,
  estado: true,
  valorEstimado: true,
  categoria: {
    select: {
      nombre: true
    }
  },
  ubicacion: {
    select: {
      id: true,
      nombre: true,
      laboratorio: {
        select: {
          id: true,
          codigo: true,
          nombre: true,
          facultadId: true
        }
      }
    }
  },
  responsable: {
    select: {
      nombre: true,
      correo: true
    }
  }
} satisfies Prisma.EquipoSelect;

const loanReportSelect = {
  id: true,
  codigo: true,
  tipoUso: true,
  fechaSolicitud: true,
  fechaEntrega: true,
  fechaDevolucionEstimada: true,
  fechaDevolucionReal: true,
  estado: true,
  observaciones: true,
  solicitanteNombre: true,
  solicitanteCorreo: true,
  solicitanteDocumento: true,
  usuarioSolicitante: {
    select: {
      nombre: true,
      correo: true,
      documento: true
    }
  },
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
  aprobadoPor: {
    select: {
      nombre: true
    }
  },
  entregadoPor: {
    select: {
      nombre: true
    }
  },
  evidencias: {
    select: {
      tipo: true,
      firmanteNombre: true,
      nombreArchivo: true
    },
    orderBy: {
      id: "asc"
    }
  },
  detalles: {
    select: {
      cantidadSolicitada: true,
      cantidadAprobada: true,
      cantidadEntregada: true,
      cantidadDevuelta: true,
      estadoEntrega: true,
      estadoDevolucion: true,
      equipo: {
        select: {
          codigoInterno: true,
          nombre: true,
          ubicacion: {
            select: {
              id: true,
              nombre: true,
              laboratorio: {
                select: {
                  id: true,
                  codigo: true,
                  nombre: true,
                  facultadId: true
                }
              }
            }
          }
        }
      },
      equipoUnidad: {
        select: {
          codigoInterno: true,
          serial: true
        }
      }
    }
  }
} satisfies Prisma.PrestamoSelect;

const maintenanceReportSelect = {
  id: true,
  tipoMantenimiento: true,
  descripcion: true,
  fechaInicio: true,
  fechaFin: true,
  estado: true,
  observaciones: true,
  equipo: {
    select: {
      codigoInterno: true,
      nombre: true,
      ubicacion: {
        select: {
          id: true,
          nombre: true,
          laboratorio: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
              facultadId: true
            }
          }
        }
      }
    }
  },
  equipoUnidad: {
    select: {
      codigoInterno: true,
      serial: true
    }
  },
  responsable: {
    select: {
      nombre: true,
      correo: true
    }
  }
} satisfies Prisma.MantenimientoSelect;

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async inventoryXlsx(user: JwtUser) {
    const rows = await this.getInventoryRows(user);
    const locationPaths = await this.getLocationPaths(user);
    return {
      contentType: xlsxContentType,
      buffer: createXlsxWorkbook("Inventario", rows, [
        { header: "Codigo", value: (row) => row.codigoInterno },
        { header: "Barras", value: (row) => row.codigoBarras },
        { header: "Equipo", value: (row) => row.nombre },
        { header: "Categoria", value: (row) => row.categoria.nombre },
        { header: "Marca", value: (row) => row.marca },
        { header: "Modelo", value: (row) => row.modelo },
        { header: "Ubicacion", value: (row) => this.locationPath(row.ubicacion.id, locationPaths) },
        { header: "Estado", value: (row) => row.estado },
        { header: "Total", value: (row) => row.cantidadTotal },
        { header: "Disponible", value: (row) => row.cantidadDisponible },
        { header: "Prestado", value: (row) => row.cantidadPrestada },
        { header: "Mantenimiento", value: (row) => row.cantidadMantenimiento },
        { header: "Baja", value: (row) => row.cantidadBaja },
        { header: "Responsable", value: (row) => row.responsable?.nombre }
      ])
    };
  }

  async inventoryPdf(user: JwtUser) {
    const rows = await this.getInventoryRows(user);
    const locationPaths = await this.getLocationPaths(user);
    const reportCode = this.createReportCode("INV");
    return {
      contentType: pdfContentType,
      buffer: createInventoryReportPdf({
        reportCode,
        verificationUrl: this.createVerificationUrl(reportCode),
        generatedAt: new Date(),
        generatedBy: user.nombre,
        faculty: this.resolveFacultyName(),
        scope: `Inventario FCI - ${new Set(rows.map((row) => row.ubicacion.laboratorio.id)).size} laboratorios`,
        rows: rows.map((row) => ({
          codigo: row.codigoInterno,
          equipo: row.nombre,
          categoria: row.categoria.nombre,
          estado: row.estado,
          disponible: row.cantidadDisponible,
          total: row.cantidadTotal,
          prestado: row.cantidadPrestada,
          mantenimiento: row.cantidadMantenimiento,
          baja: row.cantidadBaja,
          ubicacion: this.locationPath(row.ubicacion.id, locationPaths),
          detalleUbicacion: row.ubicacion.laboratorio.nombre
        }))
      })
    };
  }

  async loansXlsx(user: JwtUser) {
    const rows = await this.getLoanRows(user);
    const flattened = rows.flatMap((loan) =>
      loan.detalles.map((detail) => ({ loan, detail }))
    );
    return {
      contentType: xlsxContentType,
      buffer: createXlsxWorkbook("Prestamos", flattened, [
        { header: "Codigo", value: (row) => row.loan.codigo },
        { header: "Estado", value: (row) => row.loan.estado },
        { header: "Solicitante", value: (row) => requesterName(row.loan) },
        { header: "Correo", value: (row) => requesterEmail(row.loan) },
        { header: "Uso", value: (row) => row.loan.tipoUso },
        { header: "Solicitud", value: (row) => row.loan.fechaSolicitud },
        { header: "Entrega", value: (row) => row.loan.fechaEntrega },
        { header: "Devolucion estimada", value: (row) => row.loan.fechaDevolucionEstimada },
        { header: "Devolucion real", value: (row) => row.loan.fechaDevolucionReal },
        { header: "Equipo", value: (row) => row.detail.equipo.nombre },
        { header: "Codigo equipo", value: (row) => row.detail.equipo.codigoInterno },
        { header: "Unidad", value: (row) => row.detail.equipoUnidad?.codigoInterno },
        { header: "Solicitado", value: (row) => row.detail.cantidadSolicitada },
        { header: "Aprobado", value: (row) => row.detail.cantidadAprobada },
        { header: "Entregado", value: (row) => row.detail.cantidadEntregada },
        { header: "Devuelto", value: (row) => row.detail.cantidadDevuelta }
      ])
    };
  }

  async loansPdf(user: JwtUser) {
    const rows = await this.getLoanRows(user);
    const locationPaths = await this.getLocationPaths(user);
    const flattened = rows.flatMap((loan) =>
      loan.detalles.map((detail) => ({ loan, detail }))
    );
    const reportCode = this.createReportCode("PRE");
    return {
      contentType: pdfContentType,
      buffer: createTableReportPdf({
        reportCode,
        verificationUrl: this.createVerificationUrl(reportCode),
        generatedAt: new Date(),
        generatedBy: user.nombre,
        faculty: this.resolveFacultyName(),
        scope: `Prestamos FCI - ${rows.length} solicitudes`,
        titleLine1: "Prestamos",
        titleLine2: "de equipos",
        summaryTiles: [
          { label: "Prestamos", value: rows.length, color: "#10201a" },
          { label: "Items", value: flattened.length, color: "#1c7344" },
          { label: "Pendientes", value: this.countStatuses(rows, ["SOLICITADO", "PENDIENTE"]), color: "#b9740a" },
          { label: "Activos", value: this.countStatuses(rows, ["APROBADO", "ENTREGADO"]), color: "#2563eb" },
          { label: "Cerrados", value: this.countStatuses(rows, ["DEVUELTO", "CERRADO", "FINALIZADO"]), color: "#64748b" }
        ],
        rows: flattened,
        columns: [
          { header: "Codigo", width: 58, value: (row) => row.loan.codigo, bold: true },
          { header: "Estado", width: 64, value: (row) => row.loan.estado },
          { header: "Solicitante", width: 98, value: (row) => requesterName(row.loan), maxLines: 2 },
          { header: "Equipo", width: 118, value: (row) => `${row.detail.equipo.codigoInterno} - ${row.detail.equipo.nombre}`, bold: true, maxLines: 2 },
          { header: "Cant.", width: 36, value: (row) => row.detail.cantidadEntregada || row.detail.cantidadAprobada || row.detail.cantidadSolicitada },
          { header: "Vence", width: 66, value: (row) => row.loan.fechaDevolucionEstimada },
          { header: "Ubicacion", width: 75, value: (row) => this.locationPath(row.detail.equipo.ubicacion.id, locationPaths), maxLines: 3 }
        ]
      })
    };
  }

  async maintenanceXlsx(user: JwtUser) {
    const rows = await this.getMaintenanceRows(user);
    return {
      contentType: xlsxContentType,
      buffer: createXlsxWorkbook("Mantenimientos", rows, [
        { header: "ID", value: (row) => row.id },
        { header: "Estado", value: (row) => row.estado },
        { header: "Tipo", value: (row) => row.tipoMantenimiento },
        { header: "Equipo", value: (row) => row.equipo.nombre },
        { header: "Codigo equipo", value: (row) => row.equipo.codigoInterno },
        { header: "Unidad", value: (row) => row.equipoUnidad?.codigoInterno },
        { header: "Responsable", value: (row) => row.responsable.nombre },
        { header: "Inicio", value: (row) => row.fechaInicio },
        { header: "Fin", value: (row) => row.fechaFin },
        { header: "Descripcion", value: (row) => row.descripcion },
        { header: "Observaciones", value: (row) => row.observaciones }
      ])
    };
  }

  async maintenancePdf(user: JwtUser) {
    const rows = await this.getMaintenanceRows(user);
    const locationPaths = await this.getLocationPaths(user);
    const reportCode = this.createReportCode("MAN");
    return {
      contentType: pdfContentType,
      buffer: createTableReportPdf({
        reportCode,
        verificationUrl: this.createVerificationUrl(reportCode),
        generatedAt: new Date(),
        generatedBy: user.nombre,
        faculty: this.resolveFacultyName(),
        scope: `Mantenimientos FCI - ${rows.length} registros`,
        titleLine1: "Mantenimientos",
        titleLine2: "de equipos",
        summaryTiles: [
          { label: "Registros", value: rows.length, color: "#10201a" },
          { label: "Abiertos", value: this.countStatuses(rows, ["PROGRAMADO", "PROCESO", "PENDIENTE"]), color: "#2563eb" },
          { label: "Cerrados", value: this.countStatuses(rows, ["FINALIZADO", "CERRADO", "COMPLETADO"]), color: "#1c7344" },
          { label: "Cancelados", value: this.countStatuses(rows, ["CANCELADO"]), color: "#dc2626" }
        ],
        rows,
        columns: [
          { header: "ID", width: 36, value: (row) => `#${row.id}`, bold: true },
          { header: "Estado", width: 68, value: (row) => row.estado },
          { header: "Tipo", width: 72, value: (row) => row.tipoMantenimiento },
          { header: "Equipo", width: 124, value: (row) => `${row.equipo.codigoInterno} - ${row.equipo.nombre}`, bold: true, maxLines: 2 },
          { header: "Responsable", width: 86, value: (row) => row.responsable.nombre, maxLines: 2 },
          { header: "Inicio", width: 64, value: (row) => row.fechaInicio },
          { header: "Ubicacion", width: 65, value: (row) => this.locationPath(row.equipo.ubicacion.id, locationPaths), maxLines: 3 }
        ]
      })
    };
  }

  async loanActPdf(user: JwtUser, id: number) {
    const loan = await this.findLoanForAct(user, id);
    return {
      contentType: pdfContentType,
      buffer: createPdfDocument({
        title: "SILAB FCI - Acta de prestamo",
        subtitle: `Prestamo ${loan.codigo}`,
        sections: [
          {
            heading: "Datos generales",
            lines: [
              `Solicitante: ${requesterName(loan)}`,
              `Documento: ${requesterDocument(loan)}`,
              `Correo: ${requesterEmail(loan)}`,
              `Estado: ${loan.estado}`,
              `Uso: ${loan.tipoUso}`,
              `Fecha solicitud: ${formatDate(loan.fechaSolicitud)}`,
              `Fecha entrega: ${loan.fechaEntrega ? formatDate(loan.fechaEntrega) : "Sin entrega"}`,
              `Devolucion estimada: ${formatDate(loan.fechaDevolucionEstimada)}`,
              `Aprobado por: ${loan.aprobadoPor?.nombre ?? "Pendiente"}`,
              `Entregado por: ${loan.entregadoPor?.nombre ?? "Pendiente"}`
            ]
          },
          {
            heading: "Equipos",
            lines: loan.detalles.map(
              (detail) =>
                `${detail.equipo.codigoInterno} - ${detail.equipo.nombre} | Unidad: ${detail.equipoUnidad?.codigoInterno ?? "N/A"} | Entregado: ${detail.cantidadEntregada} | Estado entrega: ${detail.estadoEntrega ?? "N/A"}`
            )
          },
          {
            heading: "Firmas",
            lines: deliveryEvidenceLines(loan)
          }
        ]
      })
    };
  }

  async returnActPdf(user: JwtUser, id: number) {
    const returnRecord = await this.findReturnForAct(user, id);
    return {
      contentType: pdfContentType,
      buffer: createPdfDocument({
        title: "SILAB FCI - Acta de devolucion",
        subtitle: `Devolucion #${returnRecord.id} - Prestamo ${returnRecord.prestamo.codigo}`,
        sections: [
          {
            heading: "Datos generales",
            lines: [
              `Solicitante: ${requesterName(returnRecord.prestamo)}`,
              `Recibido por: ${returnRecord.usuarioRecibe.nombre}`,
              `Fecha devolucion: ${formatDate(returnRecord.fechaDevolucion)}`,
              `Estado prestamo: ${returnRecord.prestamo.estado}`,
              `Observaciones: ${returnRecord.observaciones ?? "Sin observaciones"}`
            ]
          },
          {
            heading: "Equipos devueltos",
            lines: returnRecord.detalles.map(
              (detail) =>
                `${detail.equipo.codigoInterno} - ${detail.equipo.nombre} | Unidad: ${detail.equipoUnidad?.codigoInterno ?? "N/A"} | Cantidad: ${detail.cantidad} | Condicion: ${detail.estadoDevolucion}`
            )
          },
          {
            heading: "Firmas",
            lines: [
              "Recibe laboratorio: ______________________",
              "Entrega usuario: _________________________"
            ]
          }
        ]
      })
    };
  }

  private async getInventoryRows(user: JwtUser) {
    const scopedFacultyId = getUserFacultyScope(user);
    return this.prisma.equipo.findMany({
      where: {
        deletedAt: null,
        ubicacion: {
          laboratorio: {
            facultadId: scopedFacultyId
          }
        }
      },
      select: equipmentReportSelect,
      orderBy: [{ nombre: "asc" }, { codigoInterno: "asc" }]
    });
  }

  private async getLoanRows(user: JwtUser) {
    const scopedFacultyId = getUserFacultyScope(user);
    return this.prisma.prestamo.findMany({
      where: {
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
      select: loanReportSelect,
      orderBy: { fechaSolicitud: "desc" }
    });
  }

  private async getMaintenanceRows(user: JwtUser) {
    const scopedFacultyId = getUserFacultyScope(user);
    return this.prisma.mantenimiento.findMany({
      where: {
        deletedAt: null,
        equipo: {
          ubicacion: {
            laboratorio: {
              facultadId: scopedFacultyId
            }
          }
        }
      },
      select: maintenanceReportSelect,
      orderBy: { fechaInicio: "desc" }
    });
  }

  private async findLoanForAct(user: JwtUser, id: number) {
    const rows = await this.getLoanRows(user);
    const loan = rows.find((row) => row.id === id);
    if (!loan) {
      throw new NotFoundException("Prestamo no encontrado para acta.");
    }
    return loan;
  }

  private async findReturnForAct(user: JwtUser, id: number) {
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
            nombre: true
          }
        },
        prestamo: {
          select: {
            codigo: true,
            estado: true,
            solicitanteNombre: true,
            solicitanteCorreo: true,
            solicitanteDocumento: true,
            usuarioSolicitante: {
              select: {
                nombre: true,
                correo: true,
                documento: true
              }
            },
            personaSolicitante: {
              select: {
                codigo: true,
                nombre: true,
                correoInstitucional: true,
                carrera: true,
                semestre: true,
                rol: true
              }
            }
          }
        },
        detalles: {
          select: {
            cantidad: true,
            estadoDevolucion: true,
            equipo: {
              select: {
                codigoInterno: true,
                nombre: true
              }
            },
            equipoUnidad: {
              select: {
                codigoInterno: true
              }
            }
          }
        }
      }
    });

    if (!returnRecord) {
      throw new NotFoundException("Devolucion no encontrada para acta.");
    }

    return returnRecord;
  }

  private countStatuses<T extends { estado: string }>(rows: T[], matches: string[]) {
    return rows.filter((row) => {
      const estado = row.estado.toUpperCase();
      return matches.some((match) => estado.includes(match));
    }).length;
  }

  private async getLocationPaths(user: JwtUser) {
    const scopedFacultyId = getUserFacultyScope(user);
    const locations = await this.prisma.ubicacion.findMany({
      where: {
        deletedAt: null,
        laboratorio: {
          facultadId: scopedFacultyId
        }
      },
      select: {
        id: true,
        nombre: true,
        ubicacionPadreId: true,
        laboratorio: {
          select: {
            codigo: true
          }
        }
      }
    });

    const byId = new Map(locations.map((location) => [location.id, location]));
    const paths = new Map<number, string>();

    for (const location of locations) {
      const chain: string[] = [];
      const visited = new Set<number>();
      let cursor: (typeof location) | undefined = location;
      while (cursor && !visited.has(cursor.id)) {
        visited.add(cursor.id);
        chain.unshift(cursor.nombre);
        cursor = cursor.ubicacionPadreId ? byId.get(cursor.ubicacionPadreId) : undefined;
      }
      paths.set(location.id, `${location.laboratorio.codigo} / ${chain.join(" / ")}`);
    }

    return paths;
  }

  private locationPath(locationId: number, paths: Map<number, string>) {
    return paths.get(locationId) ?? `Ubicacion ${locationId}`;
  }

  private createReportCode(prefix: string) {
    const now = new Date();
    const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
    const timePart = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`;
    return `REP-${prefix}-${datePart}-${timePart}`;
  }

  private createVerificationUrl(reportCode: string) {
    const frontendUrl = (process.env.PUBLIC_FRONTEND_URL ?? process.env.CORS_ORIGIN?.split(",")[0] ?? "http://localhost:5173").replace(/\/$/, "");
    return `${frontendUrl}/verify-report/${encodeURIComponent(reportCode)}`;
  }

  private resolveFacultyName() {
    return "Facultad de Ciencias e Ingenieria";
  }
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function requesterName(loan: {
  personaSolicitante?: { nombre: string } | null;
  usuarioSolicitante?: { nombre: string } | null;
  solicitanteNombre?: string | null;
}) {
  return (
    loan.personaSolicitante?.nombre ??
    loan.usuarioSolicitante?.nombre ??
    loan.solicitanteNombre ??
    "Solicitante manual"
  );
}

function requesterEmail(loan: {
  personaSolicitante?: { correoInstitucional?: string | null } | null;
  usuarioSolicitante?: { correo: string } | null;
  solicitanteCorreo?: string | null;
}) {
  return loan.personaSolicitante?.correoInstitucional ?? loan.usuarioSolicitante?.correo ?? loan.solicitanteCorreo ?? "";
}

function requesterDocument(loan: {
  personaSolicitante?: { codigo?: string | null } | null;
  usuarioSolicitante?: { documento: string } | null;
  solicitanteDocumento?: string | null;
}) {
  return loan.personaSolicitante?.codigo ?? loan.usuarioSolicitante?.documento ?? loan.solicitanteDocumento ?? "";
}

function deliveryEvidenceLines(loan: {
  evidencias?: Array<{
    tipo: string;
    firmanteNombre?: string | null;
    nombreArchivo?: string | null;
  }>;
}) {
  const evidencias = loan.evidencias ?? [];
  const photos = evidencias.filter((evidence) => evidence.tipo === "FOTO");
  const signatures = evidencias.filter((evidence) => evidence.tipo !== "FOTO");

  if (!evidencias.length) {
    return [
      "Entrega: ________________________________",
      "Recibe: _________________________________"
    ];
  }

  return [
    `Fotos registradas: ${photos.length}`,
    ...signatures.map(
      (signature) => `${signature.tipo}: ${signature.firmanteNombre ?? "Firmante registrado"}`
    )
  ];
}
