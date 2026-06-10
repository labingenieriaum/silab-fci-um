ALTER TABLE "solicitudes_publicas_prestamo" ADD COLUMN "rol_solicitante" "RolPersonaPrestamo" NOT NULL DEFAULT 'ESTUDIANTE';
ALTER TABLE "solicitudes_publicas_prestamo" ADD COLUMN "identificacion" TEXT;
ALTER TABLE "solicitudes_publicas_prestamo" ADD COLUMN "programa" TEXT;
ALTER TABLE "solicitudes_publicas_prestamo" ADD COLUMN "semestre" INTEGER;
ALTER TABLE "solicitudes_publicas_prestamo" ADD COLUMN "materia" TEXT;
ALTER TABLE "solicitudes_publicas_prestamo" ADD COLUMN "dependencia" TEXT;

CREATE INDEX "solicitudes_publicas_prestamo_rol_solicitante_idx" ON "solicitudes_publicas_prestamo"("rol_solicitante");
CREATE INDEX "solicitudes_publicas_prestamo_identificacion_idx" ON "solicitudes_publicas_prestamo"("identificacion");
CREATE INDEX "solicitudes_publicas_prestamo_programa_idx" ON "solicitudes_publicas_prestamo"("programa");
