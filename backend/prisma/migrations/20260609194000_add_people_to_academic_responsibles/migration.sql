ALTER TABLE "semilleros"
ALTER COLUMN "coordinador_id" DROP NOT NULL,
ADD COLUMN "coordinador_persona_id" INTEGER;

ALTER TABLE "proyectos"
ALTER COLUMN "responsable_id" DROP NOT NULL,
ADD COLUMN "responsable_persona_id" INTEGER;

ALTER TABLE "actividades"
ADD COLUMN "responsable_persona_id" INTEGER;

CREATE INDEX "semilleros_coordinador_persona_id_idx"
ON "semilleros"("coordinador_persona_id");

CREATE INDEX "proyectos_responsable_persona_id_idx"
ON "proyectos"("responsable_persona_id");

CREATE INDEX "actividades_responsable_persona_id_idx"
ON "actividades"("responsable_persona_id");

ALTER TABLE "semilleros"
ADD CONSTRAINT "semilleros_coordinador_persona_id_fkey"
FOREIGN KEY ("coordinador_persona_id") REFERENCES "personas_prestamo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "proyectos"
ADD CONSTRAINT "proyectos_responsable_persona_id_fkey"
FOREIGN KEY ("responsable_persona_id") REFERENCES "personas_prestamo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "actividades"
ADD CONSTRAINT "actividades_responsable_persona_id_fkey"
FOREIGN KEY ("responsable_persona_id") REFERENCES "personas_prestamo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
