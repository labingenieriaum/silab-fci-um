ALTER TABLE "equipos" ADD COLUMN "codigo_barras" TEXT;
ALTER TABLE "equipos" ADD COLUMN "qr_token" TEXT;

UPDATE "equipos"
SET "qr_token" = concat('eq_', id, '_', md5(random()::text || clock_timestamp()::text))
WHERE "qr_token" IS NULL;

ALTER TABLE "equipos" ALTER COLUMN "qr_token" SET NOT NULL;

CREATE UNIQUE INDEX "equipos_codigo_barras_key" ON "equipos"("codigo_barras");
CREATE UNIQUE INDEX "equipos_qr_token_key" ON "equipos"("qr_token");
