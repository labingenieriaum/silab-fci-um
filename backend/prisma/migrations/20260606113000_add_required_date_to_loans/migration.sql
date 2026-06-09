-- AlterTable
ALTER TABLE "prestamos"
  ADD COLUMN "fecha_requerida" TIMESTAMP(3),
  ADD COLUMN "solicitante_nombre" TEXT,
  ADD COLUMN "solicitante_correo" TEXT,
  ADD COLUMN "solicitante_documento" TEXT,
  ALTER COLUMN "usuario_solicitante_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "prestamos_fecha_requerida_idx" ON "prestamos"("fecha_requerida");

-- CreateIndex
CREATE INDEX "prestamos_solicitante_correo_idx" ON "prestamos"("solicitante_correo");
