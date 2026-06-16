ALTER TYPE "TipoUsuario" ADD VALUE IF NOT EXISTS 'PRACTICANTE';

INSERT INTO "roles" ("nombre", "descripcion", "created_at", "updated_at")
VALUES ('PRACTICANTE', 'Apoyo operativo de laboratorios con permisos equivalentes a coordinacion.', NOW(), NOW())
ON CONFLICT ("nombre") DO UPDATE
SET "descripcion" = EXCLUDED."descripcion",
    "updated_at" = NOW();

INSERT INTO "roles_permisos" ("rol_id", "permiso_id")
SELECT r."id", p."id"
FROM "roles" r
CROSS JOIN "permisos" p
WHERE r."nombre" = 'PRACTICANTE'
  AND p."codigo" IN (
    'academia:gestionar',
    'laboratorios:gestionar',
    'inventario:gestionar',
    'prestamos:aprobar',
    'prestamos:entregar',
    'devoluciones:registrar',
    'mantenimiento:gestionar',
    'reportes:ver',
    'dashboard:ver',
    'auditoria:ver'
  )
ON CONFLICT ("rol_id", "permiso_id") DO NOTHING;
