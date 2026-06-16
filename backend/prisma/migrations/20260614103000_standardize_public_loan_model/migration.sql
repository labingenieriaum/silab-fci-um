ALTER TABLE "prestamos"
ADD COLUMN "semillero_id" INTEGER;

ALTER TABLE "solicitudes_publicas_prestamo"
ADD COLUMN "cantidad_solicitada" INTEGER NOT NULL DEFAULT 1;

CREATE INDEX "prestamos_semillero_id_idx" ON "prestamos"("semillero_id");

ALTER TABLE "prestamos"
ADD CONSTRAINT "prestamos_semillero_id_fkey"
FOREIGN KEY ("semillero_id") REFERENCES "semilleros"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
