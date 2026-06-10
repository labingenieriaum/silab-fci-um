CREATE TYPE "TipoEvidenciaPrestamo" AS ENUM ('FOTO', 'FIRMA_COORDINADOR', 'FIRMA_SOLICITANTE');

ALTER TABLE "solicitudes_publicas_prestamo"
ADD COLUMN "prestamo_convertido_id" INTEGER;

CREATE TABLE "prestamos_evidencias" (
  "id" SERIAL NOT NULL,
  "prestamo_id" INTEGER NOT NULL,
  "tipo" "TipoEvidenciaPrestamo" NOT NULL,
  "nombre_archivo" TEXT,
  "mime_type" TEXT NOT NULL,
  "contenido_base64" TEXT NOT NULL,
  "firmante_nombre" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "prestamos_evidencias_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "solicitudes_publicas_prestamo_prestamo_convertido_id_key"
ON "solicitudes_publicas_prestamo"("prestamo_convertido_id");

CREATE INDEX "prestamos_evidencias_prestamo_id_idx"
ON "prestamos_evidencias"("prestamo_id");

CREATE INDEX "prestamos_evidencias_tipo_idx"
ON "prestamos_evidencias"("tipo");

ALTER TABLE "prestamos_evidencias"
ADD CONSTRAINT "prestamos_evidencias_prestamo_id_fkey"
FOREIGN KEY ("prestamo_id") REFERENCES "prestamos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "solicitudes_publicas_prestamo"
ADD CONSTRAINT "solicitudes_publicas_prestamo_prestamo_convertido_id_fkey"
FOREIGN KEY ("prestamo_convertido_id") REFERENCES "prestamos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
