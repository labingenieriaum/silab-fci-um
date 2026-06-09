-- CreateEnum
CREATE TYPE "EstadoSolicitudPublicaPrestamo" AS ENUM ('RECIBIDA', 'EN_REVISION', 'CONVERTIDA', 'RECHAZADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "solicitudes_publicas_prestamo" (
    "id" SERIAL NOT NULL,
    "codigo_solicitud" TEXT NOT NULL,
    "equipo_id" INTEGER,
    "nombre_completo" TEXT NOT NULL,
    "correo_institucional" TEXT NOT NULL,
    "codigo_recurso" TEXT NOT NULL,
    "fecha_prestamo" TIMESTAMP(3) NOT NULL,
    "fecha_devolucion_estimada" TIMESTAMP(3) NOT NULL,
    "dias_prestamo" INTEGER NOT NULL,
    "descripcion_actividad" TEXT NOT NULL,
    "estado" "EstadoSolicitudPublicaPrestamo" NOT NULL DEFAULT 'RECIBIDA',
    "observaciones_internas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "solicitudes_publicas_prestamo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "solicitudes_publicas_prestamo_codigo_solicitud_key" ON "solicitudes_publicas_prestamo"("codigo_solicitud");

-- CreateIndex
CREATE INDEX "solicitudes_publicas_prestamo_equipo_id_idx" ON "solicitudes_publicas_prestamo"("equipo_id");

-- CreateIndex
CREATE INDEX "solicitudes_publicas_prestamo_correo_institucional_idx" ON "solicitudes_publicas_prestamo"("correo_institucional");

-- CreateIndex
CREATE INDEX "solicitudes_publicas_prestamo_codigo_recurso_idx" ON "solicitudes_publicas_prestamo"("codigo_recurso");

-- CreateIndex
CREATE INDEX "solicitudes_publicas_prestamo_estado_idx" ON "solicitudes_publicas_prestamo"("estado");

-- CreateIndex
CREATE INDEX "solicitudes_publicas_prestamo_fecha_prestamo_idx" ON "solicitudes_publicas_prestamo"("fecha_prestamo");

-- AddForeignKey
ALTER TABLE "solicitudes_publicas_prestamo" ADD CONSTRAINT "solicitudes_publicas_prestamo_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
