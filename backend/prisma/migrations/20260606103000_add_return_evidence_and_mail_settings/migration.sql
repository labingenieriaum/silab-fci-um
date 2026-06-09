-- CreateEnum
CREATE TYPE "TipoEvidenciaDevolucion" AS ENUM ('FOTO', 'FIRMA_COORDINADOR', 'FIRMA_ADMIN', 'FIRMA_SOLICITANTE');

-- CreateTable
CREATE TABLE "devoluciones_evidencias" (
    "id" SERIAL NOT NULL,
    "devolucion_id" INTEGER NOT NULL,
    "tipo" "TipoEvidenciaDevolucion" NOT NULL,
    "nombre_archivo" TEXT,
    "mime_type" TEXT NOT NULL,
    "contenido_base64" TEXT NOT NULL,
    "firmante_nombre" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devoluciones_evidencias_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "devoluciones_evidencias_devolucion_id_idx" ON "devoluciones_evidencias"("devolucion_id");

-- CreateIndex
CREATE INDEX "devoluciones_evidencias_tipo_idx" ON "devoluciones_evidencias"("tipo");

-- AddForeignKey
ALTER TABLE "devoluciones_evidencias" ADD CONSTRAINT "devoluciones_evidencias_devolucion_id_fkey" FOREIGN KEY ("devolucion_id") REFERENCES "devoluciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "configuraciones_sistema" (
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuraciones_sistema_pkey" PRIMARY KEY ("clave")
);
