ALTER TABLE "solicitudes_publicas_prestamo"
ADD COLUMN "identificacion" TEXT,
ADD COLUMN "programa" TEXT,
ADD COLUMN "semestre" INTEGER,
ADD COLUMN "dependencia" TEXT,
ADD COLUMN "materia" TEXT,
ADD COLUMN "rol_solicitante" "RolPersonaPrestamo" NOT NULL DEFAULT 'ESTUDIANTE';

CREATE INDEX "solicitudes_publicas_prestamo_identificacion_idx"
ON "solicitudes_publicas_prestamo"("identificacion");

CREATE INDEX "solicitudes_publicas_prestamo_programa_idx"
ON "solicitudes_publicas_prestamo"("programa");

CREATE INDEX "solicitudes_publicas_prestamo_rol_solicitante_idx"
ON "solicitudes_publicas_prestamo"("rol_solicitante");
