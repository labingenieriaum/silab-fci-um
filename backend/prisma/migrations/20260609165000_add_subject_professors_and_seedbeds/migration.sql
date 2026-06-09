CREATE TABLE "materias_profesores" (
    "id" SERIAL NOT NULL,
    "materia_id" INTEGER NOT NULL,
    "profesor_id" INTEGER NOT NULL,
    "grupo" TEXT NOT NULL DEFAULT 'GENERAL',
    "periodo" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "materias_profesores_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "semilleros" (
    "id" SERIAL NOT NULL,
    "facultad_id" INTEGER NOT NULL,
    "coordinador_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "semilleros_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "materias" ALTER COLUMN "semestre" DROP NOT NULL;

ALTER TABLE "proyectos" ADD COLUMN "semillero_id" INTEGER;

ALTER TABLE "actividades" ADD COLUMN "facultad_id" INTEGER;
ALTER TABLE "actividades" ADD COLUMN "programa_id" INTEGER;
ALTER TABLE "actividades" ADD COLUMN "responsable_id" INTEGER;
ALTER TABLE "actividades" ADD COLUMN "semillero_id" INTEGER;

UPDATE "actividades"
SET "facultad_id" = COALESCE(
    (SELECT "id" FROM "facultades" WHERE "sigla" = 'FCI' AND "deleted_at" IS NULL LIMIT 1),
    (SELECT "id" FROM "facultades" WHERE "deleted_at" IS NULL ORDER BY "id" LIMIT 1)
)
WHERE "facultad_id" IS NULL;

ALTER TABLE "actividades" ALTER COLUMN "facultad_id" SET NOT NULL;

ALTER TABLE "prestamos" ADD COLUMN "materia_profesor_id" INTEGER;

CREATE UNIQUE INDEX "materias_profesores_materia_id_profesor_id_grupo_key" ON "materias_profesores"("materia_id", "profesor_id", "grupo");
CREATE UNIQUE INDEX "semilleros_facultad_id_codigo_key" ON "semilleros"("facultad_id", "codigo");

CREATE INDEX "materias_profesores_materia_id_idx" ON "materias_profesores"("materia_id");
CREATE INDEX "materias_profesores_profesor_id_idx" ON "materias_profesores"("profesor_id");
CREATE INDEX "materias_profesores_activo_idx" ON "materias_profesores"("activo");
CREATE INDEX "semilleros_facultad_id_idx" ON "semilleros"("facultad_id");
CREATE INDEX "semilleros_coordinador_id_idx" ON "semilleros"("coordinador_id");
CREATE INDEX "semilleros_activo_idx" ON "semilleros"("activo");
CREATE INDEX "proyectos_semillero_id_idx" ON "proyectos"("semillero_id");
CREATE INDEX "actividades_facultad_id_idx" ON "actividades"("facultad_id");
CREATE INDEX "actividades_programa_id_idx" ON "actividades"("programa_id");
CREATE INDEX "actividades_responsable_id_idx" ON "actividades"("responsable_id");
CREATE INDEX "actividades_semillero_id_idx" ON "actividades"("semillero_id");
CREATE INDEX "prestamos_materia_profesor_id_idx" ON "prestamos"("materia_profesor_id");

ALTER TABLE "materias_profesores" ADD CONSTRAINT "materias_profesores_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "materias_profesores" ADD CONSTRAINT "materias_profesores_profesor_id_fkey" FOREIGN KEY ("profesor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "semilleros" ADD CONSTRAINT "semilleros_facultad_id_fkey" FOREIGN KEY ("facultad_id") REFERENCES "facultades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "semilleros" ADD CONSTRAINT "semilleros_coordinador_id_fkey" FOREIGN KEY ("coordinador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_semillero_id_fkey" FOREIGN KEY ("semillero_id") REFERENCES "semilleros"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_facultad_id_fkey" FOREIGN KEY ("facultad_id") REFERENCES "facultades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_programa_id_fkey" FOREIGN KEY ("programa_id") REFERENCES "programas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "actividades" ADD CONSTRAINT "actividades_semillero_id_fkey" FOREIGN KEY ("semillero_id") REFERENCES "semilleros"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_materia_profesor_id_fkey" FOREIGN KEY ("materia_profesor_id") REFERENCES "materias_profesores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
