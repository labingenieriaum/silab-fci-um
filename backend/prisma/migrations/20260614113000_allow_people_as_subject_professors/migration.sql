ALTER TABLE "materias_profesores"
ALTER COLUMN "profesor_id" DROP NOT NULL;

ALTER TABLE "materias_profesores"
ADD COLUMN "profesor_persona_id" INTEGER;

CREATE UNIQUE INDEX "materias_profesores_materia_id_profesor_persona_id_grupo_key"
ON "materias_profesores"("materia_id", "profesor_persona_id", "grupo");

CREATE INDEX "materias_profesores_profesor_persona_id_idx"
ON "materias_profesores"("profesor_persona_id");

ALTER TABLE "materias_profesores"
ADD CONSTRAINT "materias_profesores_profesor_persona_id_fkey"
FOREIGN KEY ("profesor_persona_id") REFERENCES "personas_prestamo"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "materias_profesores"
ADD CONSTRAINT "materias_profesores_profesor_or_persona_check"
CHECK (
  ("profesor_id" IS NOT NULL AND "profesor_persona_id" IS NULL)
  OR ("profesor_id" IS NULL AND "profesor_persona_id" IS NOT NULL)
);
