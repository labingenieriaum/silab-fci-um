import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { createPrismaClientOptions } from "../src/prisma/prisma-client-options";

const prisma = new PrismaClient(createPrismaClientOptions());

const roles = [
  ["ADMINISTRADOR", "Acceso total al sistema."],
  ["COORDINACION_LABORATORIOS", "Gestion operativa de laboratorios e inventario."],
  ["PRACTICANTE", "Apoyo operativo de laboratorios con permisos equivalentes a coordinacion."],
  ["DECANO", "Consulta estrategica de facultad y reportes ejecutivos."],
  ["DIRECTOR_PROGRAMA", "Consulta y seguimiento por programa academico."],
  ["PROFESOR", "Solicitud y seguimiento de prestamos academicos."],
  ["ESTUDIANTE", "Solicitud y seguimiento de prestamos autorizados."],
  ["MONITOR", "Apoyo en entregas, devoluciones y operacion de laboratorio."]
] as const;

const permisos = [
  "usuarios:gestionar",
  "academia:gestionar",
  "laboratorios:gestionar",
  "inventario:gestionar",
  "prestamos:solicitar",
  "prestamos:aprobar",
  "prestamos:entregar",
  "devoluciones:registrar",
  "mantenimiento:gestionar",
  "reportes:ver",
  "dashboard:ver",
  "auditoria:ver"
];

const permisosPorRol: Record<string, string[]> = {
  ADMINISTRADOR: permisos,
  COORDINACION_LABORATORIOS: [
    "academia:gestionar",
    "laboratorios:gestionar",
    "inventario:gestionar",
    "prestamos:aprobar",
    "prestamos:entregar",
    "devoluciones:registrar",
    "mantenimiento:gestionar",
    "reportes:ver",
    "dashboard:ver",
    "auditoria:ver"
  ],
  PRACTICANTE: [
    "academia:gestionar",
    "laboratorios:gestionar",
    "inventario:gestionar",
    "prestamos:aprobar",
    "prestamos:entregar",
    "devoluciones:registrar",
    "mantenimiento:gestionar",
    "reportes:ver",
    "dashboard:ver",
    "auditoria:ver"
  ],
  DECANO: ["reportes:ver", "dashboard:ver"],
  DIRECTOR_PROGRAMA: ["reportes:ver", "dashboard:ver"],
  PROFESOR: ["prestamos:solicitar", "reportes:ver", "dashboard:ver"],
  ESTUDIANTE: ["prestamos:solicitar"],
  MONITOR: [
    "inventario:gestionar",
    "prestamos:entregar",
    "devoluciones:registrar",
    "mantenimiento:gestionar",
    "dashboard:ver"
  ]
};

async function main() {
  const fci = await prisma.facultad.upsert({
    where: { sigla: "FCI" },
    update: {
      nombre: "Facultad de Ciencias e Ingenieria",
      deletedAt: null
    },
    create: {
      nombre: "Facultad de Ciencias e Ingenieria",
      sigla: "FCI"
    }
  });

  const permisosCreados = await Promise.all(
    permisos.map((codigo) => {
      return prisma.permiso.upsert({
        where: { codigo },
        update: {},
        create: { codigo }
      });
    })
  );

  for (const [nombre, descripcion] of roles) {
    await prisma.rol.upsert({
      where: { nombre },
      update: { descripcion },
      create: { nombre, descripcion }
    });
  }

  const rolesCreados = await prisma.rol.findMany({
    where: {
      nombre: {
        in: roles.map(([nombre]) => nombre)
      }
    }
  });

  for (const rol of rolesCreados) {
    const codigosPermitidos = permisosPorRol[rol.nombre] ?? [];
    const permisosDelRol = permisosCreados.filter((permiso) =>
      codigosPermitidos.includes(permiso.codigo)
    );

    for (const permiso of permisosDelRol) {
      await prisma.rolPermiso.upsert({
        where: {
          rolId_permisoId: {
            rolId: rol.id,
            permisoId: permiso.id
          }
        },
        update: {},
        create: {
          rolId: rol.id,
          permisoId: permiso.id
        }
      });
    }
  }

  const adminRole = await prisma.rol.findUniqueOrThrow({
    where: { nombre: "ADMINISTRADOR" }
  });

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@silabfci.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin12345*";
  const adminDocument = process.env.ADMIN_DOCUMENT ?? "0000000000";

  await prisma.usuario.upsert({
    where: { correo: adminEmail },
    update: {
      rolId: adminRole.id,
      facultadId: null,
      nombre: process.env.ADMIN_NAME ?? "Administrador SILAB FCI",
      tipoUsuario: "ADMINISTRADOR",
      activo: true,
      deletedAt: null
    },
    create: {
      rolId: adminRole.id,
      facultadId: process.env.ADMIN_FACULTY_SIGLA === "FCI" ? fci.id : null,
      nombre: process.env.ADMIN_NAME ?? "Administrador SILAB FCI",
      correo: adminEmail,
      documento: adminDocument,
      passwordHash: await bcrypt.hash(adminPassword, 12),
      tipoUsuario: "ADMINISTRADOR",
      activo: true
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
