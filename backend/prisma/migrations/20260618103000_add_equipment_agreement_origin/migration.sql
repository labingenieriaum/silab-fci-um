CREATE TYPE "OrigenEquipo" AS ENUM ('PROPIO', 'CONVENIO');

ALTER TABLE "equipos"
ADD COLUMN "origen" "OrigenEquipo" NOT NULL DEFAULT 'PROPIO',
ADD COLUMN "convenio_entidad" TEXT,
ADD COLUMN "convenio_responsable" TEXT,
ADD COLUMN "convenio_documento_nombre" TEXT,
ADD COLUMN "convenio_documento_mime_type" TEXT,
ADD COLUMN "convenio_documento_base64" TEXT;
