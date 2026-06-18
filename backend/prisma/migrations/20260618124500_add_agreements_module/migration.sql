CREATE TABLE "convenios" (
  "id" SERIAL PRIMARY KEY,
  "nombre" TEXT NOT NULL,
  "identificacion" TEXT,
  "correo" TEXT,
  "telefono" TEXT,
  "contacto" TEXT,
  "observaciones" TEXT,
  "documento_nombre" TEXT,
  "documento_mime_type" TEXT,
  "documento_base64" TEXT,
  "activo" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  "deleted_at" TIMESTAMP(3)
);

CREATE INDEX "convenios_activo_idx" ON "convenios"("activo");

ALTER TABLE "equipos"
ADD COLUMN "convenio_id" INTEGER;

CREATE INDEX "equipos_convenio_id_idx" ON "equipos"("convenio_id");

ALTER TABLE "equipos"
ADD CONSTRAINT "equipos_convenio_id_fkey"
FOREIGN KEY ("convenio_id") REFERENCES "convenios"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
