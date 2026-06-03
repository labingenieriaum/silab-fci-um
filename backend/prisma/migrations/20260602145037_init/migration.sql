-- CreateEnum
CREATE TYPE "TipoUsuario" AS ENUM ('ADMINISTRADOR', 'COORDINACION_LABORATORIOS', 'DECANO', 'DIRECTOR_PROGRAMA', 'PROFESOR', 'ESTUDIANTE', 'MONITOR');

-- CreateEnum
CREATE TYPE "TipoUbicacion" AS ENUM ('EDIFICIO', 'PISO', 'LABORATORIO', 'SALA', 'ALMACEN', 'ESTANTE', 'GABINETE', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoEquipo" AS ENUM ('DISPONIBLE', 'PRESTADO', 'EN_MANTENIMIENTO', 'DANADO', 'BAJA', 'PERDIDO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "TipoProyecto" AS ENUM ('AULA', 'INVESTIGACION', 'EXTENSION', 'SEMILLERO', 'GRADO', 'ADMINISTRATIVO', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoActividad" AS ENUM ('CLASE', 'PRACTICA', 'INVESTIGACION', 'EXTENSION', 'CAPACITACION', 'EVENTO', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoUso" AS ENUM ('ACADEMICO', 'INVESTIGACION', 'EXTENSION', 'ADMINISTRATIVO', 'PROYECTO', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoPrestamo" AS ENUM ('SOLICITADO', 'APROBADO', 'RECHAZADO', 'ENTREGADO', 'DEVUELTO_PARCIAL', 'DEVUELTO', 'VENCIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "EstadoCondicionEquipo" AS ENUM ('BUENO', 'REGULAR', 'DANADO', 'INCOMPLETO', 'PERDIDO', 'NO_APLICA');

-- CreateEnum
CREATE TYPE "TipoMovimiento" AS ENUM ('ENTRADA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO', 'PRESTAMO', 'DEVOLUCION', 'TRASLADO', 'MANTENIMIENTO_ENTRADA', 'MANTENIMIENTO_SALIDA', 'BAJA');

-- CreateEnum
CREATE TYPE "TipoMantenimiento" AS ENUM ('PREVENTIVO', 'CORRECTIVO', 'CALIBRACION', 'REVISION', 'OTRO');

-- CreateEnum
CREATE TYPE "EstadoMantenimiento" AS ENUM ('ABIERTO', 'EN_PROCESO', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoArchivo" AS ENUM ('IMAGEN', 'FACTURA', 'MANUAL', 'ACTA', 'SOPORTE', 'OTRO');

-- CreateTable
CREATE TABLE "facultades" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "sigla" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "facultades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programas" (
    "id" SERIAL NOT NULL,
    "facultad_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "programas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permisos" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permisos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles_permisos" (
    "rol_id" INTEGER NOT NULL,
    "permiso_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_permisos_pkey" PRIMARY KEY ("rol_id","permiso_id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "rol_id" INTEGER NOT NULL,
    "facultad_id" INTEGER,
    "programa_id" INTEGER,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "tipo_usuario" "TipoUsuario" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_acceso" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laboratorios" (
    "id" SERIAL NOT NULL,
    "facultad_id" INTEGER NOT NULL,
    "responsable_id" INTEGER,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "laboratorios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ubicaciones" (
    "id" SERIAL NOT NULL,
    "laboratorio_id" INTEGER NOT NULL,
    "ubicacion_padre_id" INTEGER,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoUbicacion" NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "ubicaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_equipos" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "categorias_equipos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipos" (
    "id" SERIAL NOT NULL,
    "categoria_id" INTEGER NOT NULL,
    "ubicacion_id" INTEGER NOT NULL,
    "responsable_id" INTEGER,
    "codigo_interno" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "marca" TEXT,
    "modelo" TEXT,
    "requiere_serial" BOOLEAN NOT NULL DEFAULT false,
    "cantidad_total" INTEGER NOT NULL DEFAULT 1,
    "cantidad_disponible" INTEGER NOT NULL DEFAULT 1,
    "cantidad_prestada" INTEGER NOT NULL DEFAULT 0,
    "cantidad_mantenimiento" INTEGER NOT NULL DEFAULT 0,
    "cantidad_baja" INTEGER NOT NULL DEFAULT 0,
    "estado" "EstadoEquipo" NOT NULL DEFAULT 'DISPONIBLE',
    "valor_estimado" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "equipos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipos_unidades" (
    "id" SERIAL NOT NULL,
    "equipo_id" INTEGER NOT NULL,
    "ubicacion_id" INTEGER,
    "codigo_interno" TEXT NOT NULL,
    "serial" TEXT,
    "estado" "EstadoEquipo" NOT NULL DEFAULT 'DISPONIBLE',
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "equipos_unidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materias" (
    "id" SERIAL NOT NULL,
    "programa_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "semestre" INTEGER NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "materias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proyectos" (
    "id" SERIAL NOT NULL,
    "programa_id" INTEGER NOT NULL,
    "responsable_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoProyecto" NOT NULL,
    "semillero_investigacion" TEXT,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "proyectos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actividades" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" "TipoActividad" NOT NULL,
    "descripcion" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "actividades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prestamos" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "usuario_solicitante_id" INTEGER NOT NULL,
    "materia_id" INTEGER,
    "proyecto_id" INTEGER,
    "actividad_id" INTEGER,
    "aprobado_por_id" INTEGER,
    "rechazado_por_id" INTEGER,
    "entregado_por_id" INTEGER,
    "tipo_uso" "TipoUso" NOT NULL,
    "fecha_solicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_prestamo" TIMESTAMP(3),
    "fecha_aprobacion" TIMESTAMP(3),
    "fecha_rechazo" TIMESTAMP(3),
    "fecha_entrega" TIMESTAMP(3),
    "fecha_devolucion_estimada" TIMESTAMP(3) NOT NULL,
    "fecha_devolucion_real" TIMESTAMP(3),
    "estado" "EstadoPrestamo" NOT NULL DEFAULT 'SOLICITADO',
    "observaciones" TEXT,
    "motivo_rechazo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "prestamos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prestamo_detalle" (
    "id" SERIAL NOT NULL,
    "prestamo_id" INTEGER NOT NULL,
    "equipo_id" INTEGER NOT NULL,
    "equipo_unidad_id" INTEGER,
    "cantidad_solicitada" INTEGER NOT NULL DEFAULT 1,
    "cantidad_aprobada" INTEGER,
    "cantidad_entregada" INTEGER NOT NULL DEFAULT 0,
    "cantidad_devuelta" INTEGER NOT NULL DEFAULT 0,
    "estado_entrega" "EstadoCondicionEquipo",
    "estado_devolucion" "EstadoCondicionEquipo",
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prestamo_detalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devoluciones" (
    "id" SERIAL NOT NULL,
    "prestamo_id" INTEGER NOT NULL,
    "usuario_recibe_id" INTEGER NOT NULL,
    "fecha_devolucion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devoluciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "devolucion_detalle" (
    "id" SERIAL NOT NULL,
    "devolucion_id" INTEGER NOT NULL,
    "prestamo_detalle_id" INTEGER NOT NULL,
    "equipo_id" INTEGER NOT NULL,
    "equipo_unidad_id" INTEGER,
    "cantidad" INTEGER NOT NULL,
    "estado_devolucion" "EstadoCondicionEquipo" NOT NULL,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devolucion_detalle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventario_movimientos" (
    "id" SERIAL NOT NULL,
    "equipo_id" INTEGER NOT NULL,
    "equipo_unidad_id" INTEGER,
    "usuario_id" INTEGER NOT NULL,
    "prestamo_id" INTEGER,
    "devolucion_id" INTEGER,
    "mantenimiento_id" INTEGER,
    "ubicacion_origen_id" INTEGER,
    "ubicacion_destino_id" INTEGER,
    "tipo_movimiento" "TipoMovimiento" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "cantidad_anterior" INTEGER,
    "cantidad_nueva" INTEGER,
    "descripcion" TEXT,
    "metadata" JSONB,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventario_movimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mantenimientos" (
    "id" SERIAL NOT NULL,
    "equipo_id" INTEGER NOT NULL,
    "equipo_unidad_id" INTEGER,
    "responsable_id" INTEGER NOT NULL,
    "tipo_mantenimiento" "TipoMantenimiento" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_fin" TIMESTAMP(3),
    "costo" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "estado" "EstadoMantenimiento" NOT NULL DEFAULT 'ABIERTO',
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "mantenimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "archivos" (
    "id" SERIAL NOT NULL,
    "equipo_id" INTEGER NOT NULL,
    "subido_por_id" INTEGER,
    "nombre_archivo" TEXT NOT NULL,
    "tipo_archivo" "TipoArchivo" NOT NULL,
    "mime_type" TEXT,
    "tamano_bytes" INTEGER,
    "url" TEXT NOT NULL,
    "descripcion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "archivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" SERIAL NOT NULL,
    "usuario_id" INTEGER,
    "accion" TEXT NOT NULL,
    "modulo" TEXT,
    "tabla_afectada" TEXT NOT NULL,
    "registro_id" INTEGER,
    "datos_anteriores" JSONB,
    "datos_nuevos" JSONB,
    "ip" TEXT,
    "user_agent" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "facultades_sigla_key" ON "facultades"("sigla");

-- CreateIndex
CREATE INDEX "programas_facultad_id_idx" ON "programas"("facultad_id");

-- CreateIndex
CREATE UNIQUE INDEX "programas_facultad_id_codigo_key" ON "programas"("facultad_id", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "roles_nombre_key" ON "roles"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "permisos_codigo_key" ON "permisos"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_correo_key" ON "usuarios"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_documento_key" ON "usuarios"("documento");

-- CreateIndex
CREATE INDEX "usuarios_rol_id_idx" ON "usuarios"("rol_id");

-- CreateIndex
CREATE INDEX "usuarios_facultad_id_idx" ON "usuarios"("facultad_id");

-- CreateIndex
CREATE INDEX "usuarios_programa_id_idx" ON "usuarios"("programa_id");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_usuario_id_idx" ON "refresh_tokens"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "laboratorios_codigo_key" ON "laboratorios"("codigo");

-- CreateIndex
CREATE INDEX "laboratorios_facultad_id_idx" ON "laboratorios"("facultad_id");

-- CreateIndex
CREATE INDEX "laboratorios_responsable_id_idx" ON "laboratorios"("responsable_id");

-- CreateIndex
CREATE INDEX "ubicaciones_laboratorio_id_idx" ON "ubicaciones"("laboratorio_id");

-- CreateIndex
CREATE INDEX "ubicaciones_ubicacion_padre_id_idx" ON "ubicaciones"("ubicacion_padre_id");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_equipos_nombre_key" ON "categorias_equipos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "equipos_codigo_interno_key" ON "equipos"("codigo_interno");

-- CreateIndex
CREATE INDEX "equipos_categoria_id_idx" ON "equipos"("categoria_id");

-- CreateIndex
CREATE INDEX "equipos_ubicacion_id_idx" ON "equipos"("ubicacion_id");

-- CreateIndex
CREATE INDEX "equipos_responsable_id_idx" ON "equipos"("responsable_id");

-- CreateIndex
CREATE INDEX "equipos_estado_idx" ON "equipos"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "equipos_unidades_codigo_interno_key" ON "equipos_unidades"("codigo_interno");

-- CreateIndex
CREATE UNIQUE INDEX "equipos_unidades_serial_key" ON "equipos_unidades"("serial");

-- CreateIndex
CREATE INDEX "equipos_unidades_equipo_id_idx" ON "equipos_unidades"("equipo_id");

-- CreateIndex
CREATE INDEX "equipos_unidades_ubicacion_id_idx" ON "equipos_unidades"("ubicacion_id");

-- CreateIndex
CREATE INDEX "equipos_unidades_estado_idx" ON "equipos_unidades"("estado");

-- CreateIndex
CREATE INDEX "materias_programa_id_idx" ON "materias"("programa_id");

-- CreateIndex
CREATE UNIQUE INDEX "materias_programa_id_codigo_key" ON "materias"("programa_id", "codigo");

-- CreateIndex
CREATE INDEX "proyectos_programa_id_idx" ON "proyectos"("programa_id");

-- CreateIndex
CREATE INDEX "proyectos_responsable_id_idx" ON "proyectos"("responsable_id");

-- CreateIndex
CREATE UNIQUE INDEX "prestamos_codigo_key" ON "prestamos"("codigo");

-- CreateIndex
CREATE INDEX "prestamos_usuario_solicitante_id_idx" ON "prestamos"("usuario_solicitante_id");

-- CreateIndex
CREATE INDEX "prestamos_materia_id_idx" ON "prestamos"("materia_id");

-- CreateIndex
CREATE INDEX "prestamos_proyecto_id_idx" ON "prestamos"("proyecto_id");

-- CreateIndex
CREATE INDEX "prestamos_actividad_id_idx" ON "prestamos"("actividad_id");

-- CreateIndex
CREATE INDEX "prestamos_estado_idx" ON "prestamos"("estado");

-- CreateIndex
CREATE INDEX "prestamos_fecha_devolucion_estimada_idx" ON "prestamos"("fecha_devolucion_estimada");

-- CreateIndex
CREATE INDEX "prestamo_detalle_prestamo_id_idx" ON "prestamo_detalle"("prestamo_id");

-- CreateIndex
CREATE INDEX "prestamo_detalle_equipo_id_idx" ON "prestamo_detalle"("equipo_id");

-- CreateIndex
CREATE INDEX "prestamo_detalle_equipo_unidad_id_idx" ON "prestamo_detalle"("equipo_unidad_id");

-- CreateIndex
CREATE INDEX "devoluciones_prestamo_id_idx" ON "devoluciones"("prestamo_id");

-- CreateIndex
CREATE INDEX "devoluciones_usuario_recibe_id_idx" ON "devoluciones"("usuario_recibe_id");

-- CreateIndex
CREATE INDEX "devolucion_detalle_devolucion_id_idx" ON "devolucion_detalle"("devolucion_id");

-- CreateIndex
CREATE INDEX "devolucion_detalle_prestamo_detalle_id_idx" ON "devolucion_detalle"("prestamo_detalle_id");

-- CreateIndex
CREATE INDEX "devolucion_detalle_equipo_id_idx" ON "devolucion_detalle"("equipo_id");

-- CreateIndex
CREATE INDEX "devolucion_detalle_equipo_unidad_id_idx" ON "devolucion_detalle"("equipo_unidad_id");

-- CreateIndex
CREATE INDEX "inventario_movimientos_equipo_id_idx" ON "inventario_movimientos"("equipo_id");

-- CreateIndex
CREATE INDEX "inventario_movimientos_equipo_unidad_id_idx" ON "inventario_movimientos"("equipo_unidad_id");

-- CreateIndex
CREATE INDEX "inventario_movimientos_usuario_id_idx" ON "inventario_movimientos"("usuario_id");

-- CreateIndex
CREATE INDEX "inventario_movimientos_tipo_movimiento_idx" ON "inventario_movimientos"("tipo_movimiento");

-- CreateIndex
CREATE INDEX "inventario_movimientos_fecha_idx" ON "inventario_movimientos"("fecha");

-- CreateIndex
CREATE INDEX "mantenimientos_equipo_id_idx" ON "mantenimientos"("equipo_id");

-- CreateIndex
CREATE INDEX "mantenimientos_equipo_unidad_id_idx" ON "mantenimientos"("equipo_unidad_id");

-- CreateIndex
CREATE INDEX "mantenimientos_responsable_id_idx" ON "mantenimientos"("responsable_id");

-- CreateIndex
CREATE INDEX "mantenimientos_estado_idx" ON "mantenimientos"("estado");

-- CreateIndex
CREATE INDEX "archivos_equipo_id_idx" ON "archivos"("equipo_id");

-- CreateIndex
CREATE INDEX "archivos_subido_por_id_idx" ON "archivos"("subido_por_id");

-- CreateIndex
CREATE INDEX "auditoria_usuario_id_idx" ON "auditoria"("usuario_id");

-- CreateIndex
CREATE INDEX "auditoria_tabla_afectada_idx" ON "auditoria"("tabla_afectada");

-- CreateIndex
CREATE INDEX "auditoria_registro_id_idx" ON "auditoria"("registro_id");

-- CreateIndex
CREATE INDEX "auditoria_fecha_idx" ON "auditoria"("fecha");

-- AddForeignKey
ALTER TABLE "programas" ADD CONSTRAINT "programas_facultad_id_fkey" FOREIGN KEY ("facultad_id") REFERENCES "facultades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_permisos" ADD CONSTRAINT "roles_permisos_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "permisos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_facultad_id_fkey" FOREIGN KEY ("facultad_id") REFERENCES "facultades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_programa_id_fkey" FOREIGN KEY ("programa_id") REFERENCES "programas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laboratorios" ADD CONSTRAINT "laboratorios_facultad_id_fkey" FOREIGN KEY ("facultad_id") REFERENCES "facultades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laboratorios" ADD CONSTRAINT "laboratorios_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ubicaciones" ADD CONSTRAINT "ubicaciones_laboratorio_id_fkey" FOREIGN KEY ("laboratorio_id") REFERENCES "laboratorios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ubicaciones" ADD CONSTRAINT "ubicaciones_ubicacion_padre_id_fkey" FOREIGN KEY ("ubicacion_padre_id") REFERENCES "ubicaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipos" ADD CONSTRAINT "equipos_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias_equipos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipos" ADD CONSTRAINT "equipos_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "ubicaciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipos" ADD CONSTRAINT "equipos_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipos_unidades" ADD CONSTRAINT "equipos_unidades_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipos_unidades" ADD CONSTRAINT "equipos_unidades_ubicacion_id_fkey" FOREIGN KEY ("ubicacion_id") REFERENCES "ubicaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materias" ADD CONSTRAINT "materias_programa_id_fkey" FOREIGN KEY ("programa_id") REFERENCES "programas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_programa_id_fkey" FOREIGN KEY ("programa_id") REFERENCES "programas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proyectos" ADD CONSTRAINT "proyectos_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_usuario_solicitante_id_fkey" FOREIGN KEY ("usuario_solicitante_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_proyecto_id_fkey" FOREIGN KEY ("proyecto_id") REFERENCES "proyectos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_actividad_id_fkey" FOREIGN KEY ("actividad_id") REFERENCES "actividades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_aprobado_por_id_fkey" FOREIGN KEY ("aprobado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_rechazado_por_id_fkey" FOREIGN KEY ("rechazado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamos" ADD CONSTRAINT "prestamos_entregado_por_id_fkey" FOREIGN KEY ("entregado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamo_detalle" ADD CONSTRAINT "prestamo_detalle_prestamo_id_fkey" FOREIGN KEY ("prestamo_id") REFERENCES "prestamos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamo_detalle" ADD CONSTRAINT "prestamo_detalle_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prestamo_detalle" ADD CONSTRAINT "prestamo_detalle_equipo_unidad_id_fkey" FOREIGN KEY ("equipo_unidad_id") REFERENCES "equipos_unidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_prestamo_id_fkey" FOREIGN KEY ("prestamo_id") REFERENCES "prestamos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devoluciones" ADD CONSTRAINT "devoluciones_usuario_recibe_id_fkey" FOREIGN KEY ("usuario_recibe_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devolucion_detalle" ADD CONSTRAINT "devolucion_detalle_devolucion_id_fkey" FOREIGN KEY ("devolucion_id") REFERENCES "devoluciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devolucion_detalle" ADD CONSTRAINT "devolucion_detalle_prestamo_detalle_id_fkey" FOREIGN KEY ("prestamo_detalle_id") REFERENCES "prestamo_detalle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devolucion_detalle" ADD CONSTRAINT "devolucion_detalle_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "devolucion_detalle" ADD CONSTRAINT "devolucion_detalle_equipo_unidad_id_fkey" FOREIGN KEY ("equipo_unidad_id") REFERENCES "equipos_unidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_movimientos" ADD CONSTRAINT "inventario_movimientos_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_movimientos" ADD CONSTRAINT "inventario_movimientos_equipo_unidad_id_fkey" FOREIGN KEY ("equipo_unidad_id") REFERENCES "equipos_unidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_movimientos" ADD CONSTRAINT "inventario_movimientos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_movimientos" ADD CONSTRAINT "inventario_movimientos_prestamo_id_fkey" FOREIGN KEY ("prestamo_id") REFERENCES "prestamos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_movimientos" ADD CONSTRAINT "inventario_movimientos_devolucion_id_fkey" FOREIGN KEY ("devolucion_id") REFERENCES "devoluciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_movimientos" ADD CONSTRAINT "inventario_movimientos_mantenimiento_id_fkey" FOREIGN KEY ("mantenimiento_id") REFERENCES "mantenimientos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_movimientos" ADD CONSTRAINT "inventario_movimientos_ubicacion_origen_id_fkey" FOREIGN KEY ("ubicacion_origen_id") REFERENCES "ubicaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventario_movimientos" ADD CONSTRAINT "inventario_movimientos_ubicacion_destino_id_fkey" FOREIGN KEY ("ubicacion_destino_id") REFERENCES "ubicaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mantenimientos" ADD CONSTRAINT "mantenimientos_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mantenimientos" ADD CONSTRAINT "mantenimientos_equipo_unidad_id_fkey" FOREIGN KEY ("equipo_unidad_id") REFERENCES "equipos_unidades"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mantenimientos" ADD CONSTRAINT "mantenimientos_responsable_id_fkey" FOREIGN KEY ("responsable_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archivos" ADD CONSTRAINT "archivos_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archivos" ADD CONSTRAINT "archivos_subido_por_id_fkey" FOREIGN KEY ("subido_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
