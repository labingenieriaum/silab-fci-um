CREATE TYPE "RolPersonaPrestamo" AS ENUM ('ESTUDIANTE', 'PROFESOR', 'ADMINISTRATIVO');

CREATE TABLE "personas_prestamo" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "correo_institucional" TEXT,
    "carrera" TEXT,
    "semestre" INTEGER,
    "rol" "RolPersonaPrestamo" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "personas_prestamo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "personas_prestamo_codigo_key" ON "personas_prestamo"("codigo");
CREATE INDEX "personas_prestamo_rol_idx" ON "personas_prestamo"("rol");
CREATE INDEX "personas_prestamo_carrera_idx" ON "personas_prestamo"("carrera");
CREATE INDEX "personas_prestamo_semestre_idx" ON "personas_prestamo"("semestre");
CREATE INDEX "personas_prestamo_activo_idx" ON "personas_prestamo"("activo");

ALTER TABLE "prestamos" ADD COLUMN "persona_solicitante_id" INTEGER;
CREATE INDEX "prestamos_persona_solicitante_id_idx" ON "prestamos"("persona_solicitante_id");

ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_persona_solicitante_id_fkey"
    FOREIGN KEY ("persona_solicitante_id") REFERENCES "personas_prestamo"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
