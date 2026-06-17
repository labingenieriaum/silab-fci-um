import { Injectable } from "@nestjs/common";
import { EstadoPrestamo, type Prisma } from "@prisma/client";
import { getUserFacultyScope } from "../common/faculty-scope";
import type { JwtUser } from "../common/types/jwt-user";
import { PrismaService } from "../prisma/prisma.service";

const activeLoanStates: EstadoPrestamo[] = [
  EstadoPrestamo.ENTREGADO,
  EstadoPrestamo.DEVUELTO_PARCIAL,
  EstadoPrestamo.VENCIDO
];

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(user: JwtUser) {
    const scopedFacultyId = getUserFacultyScope(user);
    const facultyScope = this.createLoanFacultyScope(scopedFacultyId);
    const baseWhere: Prisma.PrestamoWhereInput = {
      deletedAt: null,
      AND: [facultyScope].filter(Boolean) as Prisma.PrestamoWhereInput[]
    };
    const activeWhere: Prisma.PrestamoWhereInput = {
      ...baseWhere,
      estado: { in: activeLoanStates }
    };

    const [loans, dueSoon, totalLoans, activeLoans] = await Promise.all([
      this.prisma.prestamo.findMany({
        where: baseWhere,
        select: dashboardLoanSelect
      }),
      this.prisma.prestamo.findMany({
        where: {
          ...activeWhere,
          fechaDevolucionEstimada: { gte: new Date() }
        },
        select: dashboardLoanSelect,
        orderBy: { fechaDevolucionEstimada: "asc" },
        take: 15
      }),
      this.prisma.prestamo.count({ where: baseWhere }),
      this.prisma.prestamo.count({ where: activeWhere })
    ]);

    return {
      summary: {
        totalLoans,
        activeLoans,
        dueSoon: dueSoon.length,
        overdueLoans: loans.filter((loan) => loan.estado === EstadoPrestamo.VENCIDO).length
      },
      equipmentLoaned: this.rankEquipmentLoaned(loans),
      programsByLoans: this.rankPrograms(loans),
      semestersByLoans: this.rankSemesters(loans),
      dueSoon: dueSoon.map((loan) => ({
        id: loan.id,
        codigo: loan.codigo,
        requesterName: requesterName(loan),
        requesterEmail: requesterEmail(loan),
        resource: loan.detalles.length
          ? loan.detalles.map((detail) => `${detail.equipo.codigoInterno} - ${detail.equipo.nombre}`).join(" / ")
          : "Prestamo especial",
        program: programLabel(loan),
        semester: semesterLabel(loan),
        dueDate: loan.fechaDevolucionEstimada,
        state: loan.estado
      }))
    };
  }

  private createLoanFacultyScope(scopedFacultyId?: number | null): Prisma.PrestamoWhereInput | undefined {
    if (!scopedFacultyId) {
      return undefined;
    }

    return {
      OR: [
        {
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
        },
        { detalles: { none: {} } }
      ]
    };
  }

  private rankEquipmentLoaned(loans: DashboardLoan[]) {
    const totals = new Map<string, { name: string; codigo: string; loaned: number; loans: number }>();
    for (const loan of loans.filter((item) => activeLoanStates.includes(item.estado))) {
      for (const detail of loan.detalles) {
        const pending = Math.max(0, detail.cantidadEntregada - detail.cantidadDevuelta);
        if (!pending) {
          continue;
        }
        const key = String(detail.equipo.id);
        const current = totals.get(key) ?? {
          name: detail.equipo.nombre,
          codigo: detail.equipo.codigoInterno,
          loaned: 0,
          loans: 0
        };
        current.loaned += pending;
        current.loans += 1;
        totals.set(key, current);
      }
    }

    return [...totals.values()]
      .sort((a, b) => b.loaned - a.loaned || a.name.localeCompare(b.name))
      .slice(0, 12);
  }

  private rankPrograms(loans: DashboardLoan[]) {
    const totals = new Map<string, { name: string; loans: number }>();
    for (const loan of loans) {
      const name = programLabel(loan);
      const current = totals.get(name) ?? { name, loans: 0 };
      current.loans += 1;
      totals.set(name, current);
    }
    return [...totals.values()].sort((a, b) => b.loans - a.loans || a.name.localeCompare(b.name));
  }

  private rankSemesters(loans: DashboardLoan[]) {
    const totals = new Map<string, { semester: string; loans: number }>();
    for (const loan of loans) {
      const semester = semesterLabel(loan);
      const current = totals.get(semester) ?? { semester, loans: 0 };
      current.loans += 1;
      totals.set(semester, current);
    }
    return [...totals.values()].sort((a, b) => b.loans - a.loans || a.semester.localeCompare(b.semester));
  }
}

const dashboardLoanSelect = {
  id: true,
  codigo: true,
  estado: true,
  fechaDevolucionEstimada: true,
  solicitanteNombre: true,
  solicitanteCorreo: true,
  personaSolicitante: {
    select: {
      nombre: true,
      correoInstitucional: true,
      carrera: true,
      semestre: true
    }
  },
  usuarioSolicitante: {
    select: {
      nombre: true,
      correo: true
    }
  },
  materia: {
    select: {
      semestre: true,
      programa: {
        select: {
          nombre: true,
          codigo: true
        }
      }
    }
  },
  detalles: {
    select: {
      cantidadEntregada: true,
      cantidadDevuelta: true,
      equipo: {
        select: {
          id: true,
          codigoInterno: true,
          nombre: true
        }
      }
    }
  }
} satisfies Prisma.PrestamoSelect;

type DashboardLoan = Prisma.PrestamoGetPayload<{ select: typeof dashboardLoanSelect }>;

function requesterName(loan: DashboardLoan) {
  return loan.personaSolicitante?.nombre ?? loan.usuarioSolicitante?.nombre ?? loan.solicitanteNombre ?? "Solicitante manual";
}

function requesterEmail(loan: DashboardLoan) {
  return loan.personaSolicitante?.correoInstitucional ?? loan.usuarioSolicitante?.correo ?? loan.solicitanteCorreo ?? "";
}

function programLabel(loan: DashboardLoan) {
  if (loan.materia?.programa) {
    return `${loan.materia.programa.codigo} - ${loan.materia.programa.nombre}`;
  }
  return loan.personaSolicitante?.carrera ?? "Sin programa";
}

function semesterLabel(loan: DashboardLoan) {
  const semester = loan.materia?.semestre ?? loan.personaSolicitante?.semestre;
  return semester ? `Semestre ${semester}` : "Sin semestre";
}
