import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { getUserFacultyScope, resolveFacultyForWrite } from "../common/faculty-scope";
import type { JwtUser } from "../common/types/jwt-user";
import { PrismaService } from "../prisma/prisma.service";
import { AcademicListQueryDto } from "./dto/academic-query.dto";
import { CreateActivityDto } from "./dto/create-activity.dto";
import { CreateFacultyDto } from "./dto/create-faculty.dto";
import { CreateProgramDto } from "./dto/create-program.dto";
import { CreateProjectDto } from "./dto/create-project.dto";
import { CreateSeedbedDto } from "./dto/create-seedbed.dto";
import { CreateSubjectDto, SubjectProfessorInputDto } from "./dto/create-subject.dto";
import { UpdateActivityDto } from "./dto/update-activity.dto";
import { UpdateFacultyDto } from "./dto/update-faculty.dto";
import { UpdateProgramDto } from "./dto/update-program.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { UpdateSeedbedDto } from "./dto/update-seedbed.dto";
import { UpdateSubjectDto } from "./dto/update-subject.dto";

type AcademicTx = Prisma.TransactionClient;

const facultySelect = {
  id: true,
  nombre: true,
  sigla: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      programas: true,
      laboratorios: true,
      usuarios: true
    }
  }
} satisfies Prisma.FacultadSelect;

const programSelect = {
  id: true,
  facultadId: true,
  nombre: true,
  codigo: true,
  facultad: {
    select: {
      id: true,
      nombre: true,
      sigla: true
    }
  },
  _count: {
    select: {
      usuarios: true,
      materias: true,
      proyectos: true,
      actividades: true
    }
  }
} satisfies Prisma.ProgramaSelect;

const subjectProfessorSelect = {
  id: true,
  materiaId: true,
  profesorId: true,
  profesorPersonaId: true,
  grupo: true,
  periodo: true,
  activo: true,
  profesor: {
    select: {
      id: true,
      nombre: true,
      correo: true,
      tipoUsuario: true
    }
  },
  profesorPersona: {
    select: {
      id: true,
      codigo: true,
      nombre: true,
      correoInstitucional: true,
      rol: true
    }
  }
} satisfies Prisma.MateriaProfesorSelect;

const subjectSelect = {
  id: true,
  programaId: true,
  nombre: true,
  codigo: true,
  semestre: true,
  activa: true,
  programa: {
    select: {
      id: true,
      nombre: true,
      codigo: true,
      facultadId: true,
      facultad: {
        select: {
          id: true,
          nombre: true,
          sigla: true
        }
      }
    }
  },
  profesores: {
    where: {
      deletedAt: null
    },
    select: subjectProfessorSelect,
    orderBy: [{ grupo: "asc" }, { profesor: { nombre: "asc" } }]
  },
  _count: {
    select: {
      prestamos: true
    }
  }
} satisfies Prisma.MateriaSelect;

const seedbedSelect = {
  id: true,
  facultadId: true,
  coordinadorId: true,
  coordinadorPersonaId: true,
  nombre: true,
  codigo: true,
  descripcion: true,
  activo: true,
  facultad: {
    select: {
      id: true,
      nombre: true,
      sigla: true
    }
  },
  coordinador: {
    select: {
      id: true,
      nombre: true,
      correo: true
    }
  },
  coordinadorPersona: {
    select: {
      id: true,
      codigo: true,
      nombre: true,
      correoInstitucional: true,
      rol: true
    }
  },
  _count: {
    select: {
      proyectos: true,
      actividades: true
    }
  }
} satisfies Prisma.SemilleroSelect;

const projectSelect = {
  id: true,
  programaId: true,
  responsableId: true,
  responsablePersonaId: true,
  semilleroId: true,
  nombre: true,
  tipo: true,
  semilleroInvestigacion: true,
  descripcion: true,
  activo: true,
  programa: {
    select: {
      id: true,
      nombre: true,
      codigo: true,
      facultadId: true,
      facultad: {
        select: {
          id: true,
          nombre: true,
          sigla: true
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
  responsablePersona: {
    select: {
      id: true,
      codigo: true,
      nombre: true,
      correoInstitucional: true,
      rol: true
    }
  },
  semillero: {
    select: {
      id: true,
      nombre: true,
      codigo: true
    }
  },
  _count: {
    select: {
      prestamos: true
    }
  }
} satisfies Prisma.ProyectoSelect;

const activitySelect = {
  id: true,
  facultadId: true,
  programaId: true,
  responsableId: true,
  responsablePersonaId: true,
  semilleroId: true,
  nombre: true,
  tipo: true,
  descripcion: true,
  activa: true,
  facultad: {
    select: {
      id: true,
      nombre: true,
      sigla: true
    }
  },
  programa: {
    select: {
      id: true,
      nombre: true,
      codigo: true
    }
  },
  responsable: {
    select: {
      id: true,
      nombre: true,
      correo: true
    }
  },
  responsablePersona: {
    select: {
      id: true,
      codigo: true,
      nombre: true,
      correoInstitucional: true,
      rol: true
    }
  },
  semillero: {
    select: {
      id: true,
      nombre: true,
      codigo: true
    }
  },
  _count: {
    select: {
      prestamos: true
    }
  }
} satisfies Prisma.ActividadSelect;

@Injectable()
export class AcademicService {
  constructor(private readonly prisma: PrismaService) {}

  findFaculties(user: JwtUser) {
    const scopedFacultyId = getUserFacultyScope(user);

    return this.prisma.facultad.findMany({
      where: {
        id: scopedFacultyId,
        deletedAt: null
      },
      orderBy: { nombre: "asc" },
      select: facultySelect
    });
  }

  async createFaculty(user: JwtUser, dto: CreateFacultyDto) {
    this.ensureGlobalFacultyManagement(user);

    try {
      return await this.prisma.facultad.create({
        data: {
          nombre: dto.nombre.trim(),
          sigla: dto.sigla.trim().toUpperCase()
        },
        select: facultySelect
      });
    } catch (error) {
      handleKnownDatabaseError(error, "Ya existe una facultad con esa sigla.");
    }
  }

  async updateFaculty(user: JwtUser, id: number, dto: UpdateFacultyDto) {
    this.ensureGlobalFacultyManagement(user);
    await this.findFacultyOrThrow(id);

    try {
      return await this.prisma.facultad.update({
        where: { id },
        data: {
          nombre: dto.nombre?.trim(),
          sigla: dto.sigla?.trim().toUpperCase()
        },
        select: facultySelect
      });
    } catch (error) {
      handleKnownDatabaseError(error, "Ya existe una facultad con esa sigla.");
    }
  }

  async removeFaculty(user: JwtUser, id: number) {
    this.ensureGlobalFacultyManagement(user);
    const faculty = await this.findFacultyOrThrow(id);

    if (
      faculty._count.programas > 0 ||
      faculty._count.laboratorios > 0 ||
      faculty._count.usuarios > 0
    ) {
      throw new BadRequestException(
        "No se puede eliminar una facultad con programas, laboratorios o usuarios asociados."
      );
    }

    return this.prisma.facultad.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: facultySelect
    });
  }

  findPrograms(user: JwtUser, facultadId?: number) {
    const scopedFacultyId = resolveFacultyForWrite(user, facultadId);

    return this.prisma.programa.findMany({
      where: {
        deletedAt: null,
        facultadId: scopedFacultyId
      },
      orderBy: { nombre: "asc" },
      select: programSelect
    });
  }

  async createProgram(user: JwtUser, dto: CreateProgramDto) {
    const facultadId = await this.ensureFacultyInScope(user, dto.facultadId);

    try {
      return await this.prisma.programa.create({
        data: {
          facultadId,
          nombre: dto.nombre.trim(),
          codigo: cleanCode(dto.codigo)
        },
        select: programSelect
      });
    } catch (error) {
      handleKnownDatabaseError(error, "Ya existe un programa con ese codigo en la facultad.");
    }
  }

  async updateProgram(user: JwtUser, id: number, dto: UpdateProgramDto) {
    const current = await this.findProgramOrThrow(user, id);
    const facultadId = await this.ensureFacultyInScope(user, dto.facultadId ?? current.facultadId);

    try {
      return await this.prisma.programa.update({
        where: { id },
        data: {
          facultadId: dto.facultadId === undefined ? undefined : facultadId,
          nombre: dto.nombre?.trim(),
          codigo: dto.codigo === undefined ? undefined : cleanCode(dto.codigo)
        },
        select: programSelect
      });
    } catch (error) {
      handleKnownDatabaseError(error, "Ya existe un programa con ese codigo en la facultad.");
    }
  }

  async removeProgram(user: JwtUser, id: number) {
    const program = await this.findProgramOrThrow(user, id);
    const totalRelations =
      program._count.usuarios +
      program._count.materias +
      program._count.proyectos +
      program._count.actividades;
    if (totalRelations > 0) {
      throw new BadRequestException(
        "No se puede eliminar un programa con usuarios, materias, proyectos o actividades asociados."
      );
    }

    return this.prisma.programa.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: programSelect
    });
  }

  findAcademicUsers(user: JwtUser, facultadId?: number) {
    const scopedFacultyId = resolveFacultyForWrite(user, facultadId);

    return this.prisma.usuario.findMany({
      where: {
        deletedAt: null,
        activo: true,
        facultadId: scopedFacultyId
      },
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        nombre: true,
        correo: true,
        tipoUsuario: true,
        facultadId: true,
        programaId: true
      }
    });
  }

  findAcademicPeople() {
    return this.prisma.personaPrestamo.findMany({
      where: {
        deletedAt: null,
        activo: true
      },
      orderBy: [{ nombre: "asc" }, { codigo: "asc" }],
      select: {
        id: true,
        codigo: true,
        nombre: true,
        correoInstitucional: true,
        carrera: true,
        semestre: true,
        rol: true,
        activo: true
      },
      take: 300
    });
  }

  async findSubjects(user: JwtUser, query: AcademicListQueryDto) {
    const scopedFacultyId = resolveFacultyForRead(user, query.facultadId);
    const where: Prisma.MateriaWhereInput = {
      deletedAt: null,
      programaId: query.programaId,
      activa: query.activo,
      programa: {
        facultadId: scopedFacultyId,
        deletedAt: null
      },
      OR: query.search
        ? [
            { codigo: { contains: query.search, mode: "insensitive" } },
            { nombre: { contains: query.search, mode: "insensitive" } },
            { programa: { nombre: { contains: query.search, mode: "insensitive" } } },
            {
              profesores: {
                some: {
                  deletedAt: null,
                  OR: [
                    { profesor: { nombre: { contains: query.search, mode: "insensitive" } } },
                    { profesorPersona: { nombre: { contains: query.search, mode: "insensitive" } } }
                  ]
                }
              }
            }
          ]
        : undefined
    };

    return this.findPaginated(
      this.prisma.materia.findMany({
        where,
        select: subjectSelect,
        orderBy: [{ nombre: "asc" }, { codigo: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      }),
      this.prisma.materia.count({ where }),
      query
    );
  }

  async createSubject(user: JwtUser, dto: CreateSubjectDto) {
    const program = await this.ensureProgramInScope(user, dto.programaId);
    await this.ensureProfessorAssignmentsInScope(dto.profesores ?? [], program.facultadId);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const subject = await tx.materia.create({
          data: {
            programaId: dto.programaId,
            codigo: cleanCode(dto.codigo),
            nombre: dto.nombre.trim(),
            semestre: dto.semestre ?? null,
            activa: dto.activa ?? true
          },
          select: { id: true }
        });

        await this.syncSubjectProfessors(tx, subject.id, dto.profesores ?? []);

        return tx.materia.findUniqueOrThrow({
          where: { id: subject.id },
          select: subjectSelect
        });
      });
    } catch (error) {
      handleKnownDatabaseError(error, "Ya existe una materia con ese codigo en el programa.");
    }
  }

  async updateSubject(user: JwtUser, id: number, dto: UpdateSubjectDto) {
    const current = await this.findSubjectOrThrow(user, id);
    const nextProgramId = dto.programaId ?? current.programaId;
    const program = await this.ensureProgramInScope(user, nextProgramId);

    if (dto.profesores) {
      await this.ensureProfessorAssignmentsInScope(dto.profesores, program.facultadId);
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.materia.update({
          where: { id },
          data: {
            programaId: dto.programaId,
            codigo: dto.codigo === undefined ? undefined : cleanCode(dto.codigo),
            nombre: dto.nombre?.trim(),
            semestre: dto.semestre === undefined ? undefined : dto.semestre,
            activa: dto.activa
          }
        });

        if (dto.profesores) {
          await this.syncSubjectProfessors(tx, id, dto.profesores);
        }

        return tx.materia.findUniqueOrThrow({
          where: { id },
          select: subjectSelect
        });
      });
    } catch (error) {
      handleKnownDatabaseError(error, "Ya existe una materia con ese codigo en el programa.");
    }
  }

  async removeSubject(user: JwtUser, id: number) {
    const subject = await this.findSubjectOrThrow(user, id);
    if (subject._count.prestamos > 0) {
      throw new BadRequestException("No se puede eliminar una materia con prestamos asociados.");
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.materiaProfesor.updateMany({
        where: { materiaId: id, deletedAt: null },
        data: { activo: false, deletedAt: new Date() }
      });

      return tx.materia.update({
        where: { id },
        data: { activa: false, deletedAt: new Date() },
        select: subjectSelect
      });
    });
  }

  async findSeedbeds(user: JwtUser, query: AcademicListQueryDto) {
    const scopedFacultyId = resolveFacultyForRead(user, query.facultadId);
    const where: Prisma.SemilleroWhereInput = {
      deletedAt: null,
      facultadId: scopedFacultyId,
      activo: query.activo,
      OR: query.search
        ? [
            { codigo: { contains: query.search, mode: "insensitive" } },
            { nombre: { contains: query.search, mode: "insensitive" } },
            { coordinador: { nombre: { contains: query.search, mode: "insensitive" } } },
            { coordinadorPersona: { nombre: { contains: query.search, mode: "insensitive" } } },
            { coordinadorPersona: { codigo: { contains: query.search, mode: "insensitive" } } }
          ]
        : undefined
    };

    return this.findPaginated(
      this.prisma.semillero.findMany({
        where,
        select: seedbedSelect,
        orderBy: [{ nombre: "asc" }, { codigo: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      }),
      this.prisma.semillero.count({ where }),
      query
    );
  }

  async createSeedbed(user: JwtUser, dto: CreateSeedbedDto) {
    const facultyId = await this.ensureFacultyInScope(user, dto.facultadId);
    await this.ensureAcademicResponsible({
      userId: dto.coordinadorId,
      personId: dto.coordinadorPersonaId,
      facultyId,
      userMessage: "El coordinador no pertenece a la facultad indicada.",
      missingMessage: "Selecciona un coordinador usuario o persona."
    });

    try {
      return await this.prisma.semillero.create({
        data: {
          facultadId: facultyId,
          coordinadorId: dto.coordinadorId ?? null,
          coordinadorPersonaId: dto.coordinadorPersonaId ?? null,
          codigo: cleanCode(dto.codigo),
          nombre: dto.nombre.trim(),
          descripcion: cleanNullableText(dto.descripcion),
          activo: dto.activo ?? true
        },
        select: seedbedSelect
      });
    } catch (error) {
      handleKnownDatabaseError(error, "Ya existe un semillero con ese codigo en la facultad.");
    }
  }

  async updateSeedbed(user: JwtUser, id: number, dto: UpdateSeedbedDto) {
    const current = await this.findSeedbedOrThrow(user, id);
    const facultyId = await this.ensureFacultyInScope(user, dto.facultadId ?? current.facultadId);
    const coordinator = resolveNextResponsible(
      dto.coordinadorId,
      dto.coordinadorPersonaId,
      current.coordinadorId,
      current.coordinadorPersonaId
    );
    await this.ensureAcademicResponsible({
      userId: coordinator.userId,
      personId: coordinator.personId,
      facultyId,
      userMessage: "El coordinador no pertenece a la facultad indicada.",
      missingMessage: "Selecciona un coordinador usuario o persona."
    });

    try {
      return await this.prisma.semillero.update({
        where: { id },
        data: {
          facultadId: dto.facultadId,
          coordinadorId: coordinator.userId,
          coordinadorPersonaId: coordinator.personId,
          codigo: dto.codigo === undefined ? undefined : cleanCode(dto.codigo),
          nombre: dto.nombre?.trim(),
          descripcion:
            dto.descripcion === undefined ? undefined : cleanNullableText(dto.descripcion),
          activo: dto.activo
        },
        select: seedbedSelect
      });
    } catch (error) {
      handleKnownDatabaseError(error, "Ya existe un semillero con ese codigo en la facultad.");
    }
  }

  async removeSeedbed(user: JwtUser, id: number) {
    const seedbed = await this.findSeedbedOrThrow(user, id);
    if (seedbed._count.proyectos > 0 || seedbed._count.actividades > 0) {
      throw new BadRequestException("No se puede eliminar un semillero con proyectos o actividades asociados.");
    }

    return this.prisma.semillero.update({
      where: { id },
      data: { activo: false, deletedAt: new Date() },
      select: seedbedSelect
    });
  }

  async findProjects(user: JwtUser, query: AcademicListQueryDto) {
    const scopedFacultyId = resolveFacultyForRead(user, query.facultadId);
    const where: Prisma.ProyectoWhereInput = {
      deletedAt: null,
      programaId: query.programaId,
      semilleroId: query.semilleroId,
      activo: query.activo,
      programa: {
        facultadId: scopedFacultyId,
        deletedAt: null
      },
      OR: query.search
        ? [
            { nombre: { contains: query.search, mode: "insensitive" } },
            { responsable: { nombre: { contains: query.search, mode: "insensitive" } } },
            { responsablePersona: { nombre: { contains: query.search, mode: "insensitive" } } },
            { responsablePersona: { codigo: { contains: query.search, mode: "insensitive" } } },
            { semillero: { nombre: { contains: query.search, mode: "insensitive" } } },
            { semilleroInvestigacion: { contains: query.search, mode: "insensitive" } }
          ]
        : undefined
    };

    return this.findPaginated(
      this.prisma.proyecto.findMany({
        where,
        select: projectSelect,
        orderBy: [{ nombre: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      }),
      this.prisma.proyecto.count({ where }),
      query
    );
  }

  async createProject(user: JwtUser, dto: CreateProjectDto) {
    const program = await this.ensureProgramInScope(user, dto.programaId);
    await this.ensureAcademicResponsible({
      userId: dto.responsableId,
      personId: dto.responsablePersonaId,
      facultyId: program.facultadId,
      userMessage: "El responsable no pertenece a la facultad del programa.",
      missingMessage: "Selecciona un responsable usuario o persona."
    });
    if (dto.semilleroId) {
      await this.ensureSeedbedInFaculty(user, dto.semilleroId, program.facultadId);
    }

    try {
      return await this.prisma.proyecto.create({
        data: {
          programaId: dto.programaId,
          responsableId: dto.responsableId ?? null,
          responsablePersonaId: dto.responsablePersonaId ?? null,
          semilleroId: dto.semilleroId ?? null,
          nombre: dto.nombre.trim(),
          tipo: dto.tipo,
          semilleroInvestigacion: cleanNullableText(dto.semilleroInvestigacion),
          descripcion: cleanNullableText(dto.descripcion),
          activo: dto.activo ?? true
        },
        select: projectSelect
      });
    } catch (error) {
      handleKnownDatabaseError(error, "No fue posible crear el proyecto.");
    }
  }

  async updateProject(user: JwtUser, id: number, dto: UpdateProjectDto) {
    const current = await this.findProjectOrThrow(user, id);
    const program = await this.ensureProgramInScope(user, dto.programaId ?? current.programaId);
    const responsible = resolveNextResponsible(
      dto.responsableId,
      dto.responsablePersonaId,
      current.responsableId,
      current.responsablePersonaId
    );
    await this.ensureAcademicResponsible({
      userId: responsible.userId,
      personId: responsible.personId,
      facultyId: program.facultadId,
      userMessage: "El responsable no pertenece a la facultad del programa.",
      missingMessage: "Selecciona un responsable usuario o persona."
    });
    if (dto.semilleroId) {
      await this.ensureSeedbedInFaculty(user, dto.semilleroId, program.facultadId);
    }

    return this.prisma.proyecto.update({
      where: { id },
      data: {
        programaId: dto.programaId,
        responsableId: responsible.userId,
        responsablePersonaId: responsible.personId,
        semilleroId: dto.semilleroId,
        nombre: dto.nombre?.trim(),
        tipo: dto.tipo,
        semilleroInvestigacion:
          dto.semilleroInvestigacion === undefined
            ? undefined
            : cleanNullableText(dto.semilleroInvestigacion),
        descripcion: dto.descripcion === undefined ? undefined : cleanNullableText(dto.descripcion),
        activo: dto.activo
      },
      select: projectSelect
    });
  }

  async removeProject(user: JwtUser, id: number) {
    const project = await this.findProjectOrThrow(user, id);
    if (project._count.prestamos > 0) {
      throw new BadRequestException("No se puede eliminar un proyecto con prestamos asociados.");
    }

    return this.prisma.proyecto.update({
      where: { id },
      data: { activo: false, deletedAt: new Date() },
      select: projectSelect
    });
  }

  async findActivities(user: JwtUser, query: AcademicListQueryDto) {
    const scopedFacultyId = resolveFacultyForRead(user, query.facultadId);
    const where: Prisma.ActividadWhereInput = {
      deletedAt: null,
      facultadId: scopedFacultyId,
      programaId: query.programaId,
      semilleroId: query.semilleroId,
      activa: query.activo,
      OR: query.search
        ? [
            { nombre: { contains: query.search, mode: "insensitive" } },
            { descripcion: { contains: query.search, mode: "insensitive" } },
            { responsable: { nombre: { contains: query.search, mode: "insensitive" } } },
            { responsablePersona: { nombre: { contains: query.search, mode: "insensitive" } } },
            { responsablePersona: { codigo: { contains: query.search, mode: "insensitive" } } },
            { semillero: { nombre: { contains: query.search, mode: "insensitive" } } }
          ]
        : undefined
    };

    return this.findPaginated(
      this.prisma.actividad.findMany({
        where,
        select: activitySelect,
        orderBy: [{ nombre: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize
      }),
      this.prisma.actividad.count({ where }),
      query
    );
  }

  async createActivity(user: JwtUser, dto: CreateActivityDto) {
    const facultyId = await this.ensureFacultyInScope(user, dto.facultadId);
    if (dto.programaId) {
      await this.ensureProgramInFaculty(dto.programaId, facultyId);
    }
    if (dto.responsableId) {
      await this.ensureUserInFaculty(dto.responsableId, facultyId, "El responsable no pertenece a la facultad indicada.");
    }
    if (dto.responsablePersonaId) {
      await this.ensurePersonExists(dto.responsablePersonaId, "La persona responsable no existe o no esta activa.");
    }
    ensureOnlyOneResponsible(dto.responsableId, dto.responsablePersonaId, "Selecciona usuario o persona responsable, no ambos.");
    if (dto.semilleroId) {
      await this.ensureSeedbedInFaculty(user, dto.semilleroId, facultyId);
    }

    return this.prisma.actividad.create({
      data: {
        facultadId: facultyId,
        programaId: dto.programaId ?? null,
        responsableId: dto.responsableId ?? null,
        responsablePersonaId: dto.responsablePersonaId ?? null,
        semilleroId: dto.semilleroId ?? null,
        nombre: dto.nombre.trim(),
        tipo: dto.tipo,
        descripcion: cleanNullableText(dto.descripcion),
        activa: dto.activa ?? true
      },
      select: activitySelect
    });
  }

  async updateActivity(user: JwtUser, id: number, dto: UpdateActivityDto) {
    const current = await this.findActivityOrThrow(user, id);
    const facultyId = await this.ensureFacultyInScope(user, dto.facultadId ?? current.facultadId);
    if (dto.programaId) {
      await this.ensureProgramInFaculty(dto.programaId, facultyId);
    }
    const responsible = resolveNextOptionalResponsible(
      dto.responsableId,
      dto.responsablePersonaId,
      current.responsableId,
      current.responsablePersonaId
    );
    if (responsible.userId) {
      await this.ensureUserInFaculty(responsible.userId, facultyId, "El responsable no pertenece a la facultad indicada.");
    }
    if (responsible.personId) {
      await this.ensurePersonExists(responsible.personId, "La persona responsable no existe o no esta activa.");
    }
    ensureOnlyOneResponsible(responsible.userId, responsible.personId, "Selecciona usuario o persona responsable, no ambos.");
    if (dto.semilleroId) {
      await this.ensureSeedbedInFaculty(user, dto.semilleroId, facultyId);
    }

    return this.prisma.actividad.update({
      where: { id },
      data: {
        facultadId: dto.facultadId,
        programaId: dto.programaId,
        responsableId: responsible.userId,
        responsablePersonaId: responsible.personId,
        semilleroId: dto.semilleroId,
        nombre: dto.nombre?.trim(),
        tipo: dto.tipo,
        descripcion: dto.descripcion === undefined ? undefined : cleanNullableText(dto.descripcion),
        activa: dto.activa
      },
      select: activitySelect
    });
  }

  async removeActivity(user: JwtUser, id: number) {
    const activity = await this.findActivityOrThrow(user, id);
    if (activity._count.prestamos > 0) {
      throw new BadRequestException("No se puede eliminar una actividad con prestamos asociados.");
    }

    return this.prisma.actividad.update({
      where: { id },
      data: { activa: false, deletedAt: new Date() },
      select: activitySelect
    });
  }

  private async findPaginated<T>(
    dataPromise: Prisma.PrismaPromise<T[]>,
    totalPromise: Prisma.PrismaPromise<number>,
    query: AcademicListQueryDto
  ) {
    const [data, total] = await this.prisma.$transaction([dataPromise, totalPromise]);
    return {
      data,
      page: query.page,
      pageSize: query.pageSize,
      total
    };
  }

  private async findFacultyOrThrow(id: number) {
    const faculty = await this.prisma.facultad.findFirst({
      where: { id, deletedAt: null },
      select: facultySelect
    });

    if (!faculty) {
      throw new NotFoundException("Facultad no encontrada.");
    }

    return faculty;
  }

  private async findSubjectOrThrow(user: JwtUser, id: number) {
    const scopedFacultyId = getUserFacultyScope(user);
    const subject = await this.prisma.materia.findFirst({
      where: {
        id,
        deletedAt: null,
        programa: {
          facultadId: scopedFacultyId
        }
      },
      select: subjectSelect
    });

    if (!subject) {
      throw new NotFoundException("Materia no encontrada.");
    }

    return subject;
  }

  private async findProgramOrThrow(user: JwtUser, id: number) {
    const scopedFacultyId = getUserFacultyScope(user);
    const program = await this.prisma.programa.findFirst({
      where: {
        id,
        deletedAt: null,
        facultadId: scopedFacultyId ?? undefined
      },
      select: programSelect
    });

    if (!program) {
      throw new NotFoundException("Programa no encontrado.");
    }

    return program;
  }

  private async findSeedbedOrThrow(user: JwtUser, id: number) {
    const scopedFacultyId = getUserFacultyScope(user);
    const seedbed = await this.prisma.semillero.findFirst({
      where: {
        id,
        deletedAt: null,
        facultadId: scopedFacultyId
      },
      select: seedbedSelect
    });

    if (!seedbed) {
      throw new NotFoundException("Semillero no encontrado.");
    }

    return seedbed;
  }

  private async findProjectOrThrow(user: JwtUser, id: number) {
    const scopedFacultyId = getUserFacultyScope(user);
    const project = await this.prisma.proyecto.findFirst({
      where: {
        id,
        deletedAt: null,
        programa: {
          facultadId: scopedFacultyId
        }
      },
      select: projectSelect
    });

    if (!project) {
      throw new NotFoundException("Proyecto no encontrado.");
    }

    return project;
  }

  private async findActivityOrThrow(user: JwtUser, id: number) {
    const scopedFacultyId = getUserFacultyScope(user);
    const activity = await this.prisma.actividad.findFirst({
      where: {
        id,
        deletedAt: null,
        facultadId: scopedFacultyId
      },
      select: activitySelect
    });

    if (!activity) {
      throw new NotFoundException("Actividad no encontrada.");
    }

    return activity;
  }

  private async ensureProgramInScope(user: JwtUser, programaId: number) {
    const scopedFacultyId = getUserFacultyScope(user);
    const program = await this.prisma.programa.findFirst({
      where: {
        id: programaId,
        deletedAt: null,
        facultadId: scopedFacultyId
      },
      select: {
        id: true,
        facultadId: true
      }
    });

    if (!program) {
      throw new BadRequestException("El programa indicado no existe o no pertenece a tu facultad.");
    }

    return program;
  }

  private async ensureProgramInFaculty(programaId: number, facultadId: number) {
    const program = await this.prisma.programa.findFirst({
      where: {
        id: programaId,
        deletedAt: null,
        facultadId
      },
      select: {
        id: true
      }
    });

    if (!program) {
      throw new BadRequestException("El programa indicado no pertenece a la facultad seleccionada.");
    }
  }

  private async ensureFacultyInScope(user: JwtUser, facultadId?: number | null) {
    const scopedFacultyId = resolveFacultyForWrite(user, facultadId);
    if (!scopedFacultyId) {
      throw new BadRequestException("Selecciona una facultad para esta operacion.");
    }

    await this.findFacultyOrThrow(scopedFacultyId);
    return scopedFacultyId;
  }

  private async ensureUserInFaculty(userId: number, facultyId: number, message: string) {
    const user = await this.prisma.usuario.findFirst({
      where: {
        id: userId,
        deletedAt: null,
        activo: true,
        facultadId: facultyId
      },
      select: {
        id: true
      }
    });

    if (!user) {
      throw new BadRequestException(message);
    }
  }

  private async ensurePersonExists(personId: number, message: string) {
    const person = await this.prisma.personaPrestamo.findFirst({
      where: {
        id: personId,
        deletedAt: null,
        activo: true
      },
      select: {
        id: true
      }
    });

    if (!person) {
      throw new BadRequestException(message);
    }
  }

  private async ensureAcademicResponsible({
    userId,
    personId,
    facultyId,
    userMessage,
    missingMessage
  }: {
    userId?: number | null;
    personId?: number | null;
    facultyId: number;
    userMessage: string;
    missingMessage: string;
  }) {
    if (!userId && !personId) {
      throw new BadRequestException(missingMessage);
    }
    ensureOnlyOneResponsible(userId, personId, "Selecciona usuario o persona, no ambos.");
    if (userId) {
      await this.ensureUserInFaculty(userId, facultyId, userMessage);
    }
    if (personId) {
      await this.ensurePersonExists(personId, "La persona seleccionada no existe o no esta activa.");
    }
  }

  private async ensureProfessorAssignmentsInScope(
    professors: SubjectProfessorInputDto[],
    facultyId: number
  ) {
    for (const professor of professors) {
      ensureOnlyOneResponsible(
        professor.profesorId,
        professor.profesorPersonaId,
        "Selecciona un usuario profesor o una persona profesor, no ambos."
      );
      if (!professor.profesorId && !professor.profesorPersonaId) {
        throw new BadRequestException("Selecciona el profesor de la materia.");
      }
    }

    const professorIds = Array.from(
      new Set(
        professors
          .map((professor) => professor.profesorId)
          .filter((professorId): professorId is number => typeof professorId === "number")
      )
    );
    for (const professorId of professorIds) {
      await this.ensureUserInFaculty(
        professorId,
        facultyId,
        "Uno de los profesores no pertenece a la facultad del programa."
      );
    }

    const professorPersonIds = Array.from(
      new Set(
        professors
          .map((professor) => professor.profesorPersonaId)
          .filter((professorPersonId): professorPersonId is number => typeof professorPersonId === "number")
      )
    );
    for (const professorPersonId of professorPersonIds) {
      const person = await this.prisma.personaPrestamo.findFirst({
        where: {
          id: professorPersonId,
          deletedAt: null,
          activo: true,
          rol: "PROFESOR"
        },
        select: {
          id: true
        }
      });
      if (!person) {
        throw new BadRequestException("Uno de los profesores no existe en Personas o no tiene rol profesor.");
      }
    }
  }

  private async ensureSeedbedInFaculty(user: JwtUser, semilleroId: number, facultyId: number) {
    const scopedFacultyId = getUserFacultyScope(user);
    const seedbed = await this.prisma.semillero.findFirst({
      where: {
        id: semilleroId,
        deletedAt: null,
        facultadId: facultyId,
        ...(scopedFacultyId ? { facultadId: scopedFacultyId } : {})
      },
      select: {
        id: true
      }
    });

    if (!seedbed) {
      throw new BadRequestException("El semillero indicado no pertenece a la facultad.");
    }
  }

  private async syncSubjectProfessors(
    tx: AcademicTx,
    subjectId: number,
    professors: SubjectProfessorInputDto[]
  ) {
    await tx.materiaProfesor.updateMany({
      where: {
        materiaId: subjectId,
        deletedAt: null
      },
      data: {
        activo: false
      }
    });

    for (const professor of professors) {
      const group = cleanGroup(professor.grupo);
      const current = await tx.materiaProfesor.findFirst({
        where: {
          materiaId: subjectId,
          profesorId: professor.profesorId ?? null,
          profesorPersonaId: professor.profesorPersonaId ?? null,
          grupo: group
        },
        select: {
          id: true
        }
      });
      const data = {
        profesorId: professor.profesorId ?? null,
        profesorPersonaId: professor.profesorPersonaId ?? null,
        grupo: group,
        periodo: cleanNullableText(professor.periodo),
        activo: professor.activo ?? true,
        deletedAt: null
      };
      if (current) {
        await tx.materiaProfesor.update({
          where: { id: current.id },
          data
        });
      } else {
        await tx.materiaProfesor.create({
          data: {
            materiaId: subjectId,
            ...data
          }
        });
      }
    }
  }

  private ensureGlobalFacultyManagement(user: JwtUser) {
    const scopedFacultyId = getUserFacultyScope(user);
    if (scopedFacultyId) {
      throw new ForbiddenException(
        "Solo un administrador global puede crear o eliminar facultades."
      );
    }
  }
}

function resolveFacultyForRead(user: JwtUser, requestedFacultyId?: number | null) {
  return resolveFacultyForWrite(user, requestedFacultyId);
}

function cleanNullableText(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : null;
}

function cleanCode(value: string) {
  return value.trim().toUpperCase();
}

function cleanGroup(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned.toUpperCase() : "GENERAL";
}

function ensureOnlyOneResponsible(
  userId?: number | null,
  personId?: number | null,
  message = "Selecciona usuario o persona, no ambos."
) {
  if (userId && personId) {
    throw new BadRequestException(message);
  }
}

function resolveNextResponsible(
  nextUserId: number | null | undefined,
  nextPersonId: number | null | undefined,
  currentUserId: number | null | undefined,
  currentPersonId: number | null | undefined
) {
  const userId = nextUserId === undefined ? currentUserId ?? null : nextUserId;
  const personId = nextPersonId === undefined ? currentPersonId ?? null : nextPersonId;
  return { userId, personId };
}

function resolveNextOptionalResponsible(
  nextUserId: number | null | undefined,
  nextPersonId: number | null | undefined,
  currentUserId: number | null | undefined,
  currentPersonId: number | null | undefined
) {
  return resolveNextResponsible(nextUserId, nextPersonId, currentUserId, currentPersonId);
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
