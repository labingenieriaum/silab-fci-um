# SILAB FCI - Bitacora Codex

Fecha: 2026-06-03

## Estado actual

- Proyecto: SILAB FCI, Sistema de Inventario y Laboratorios de la Facultad de Ciencias e Ingenieria.
- Etapa actual: fase 3 completada con backend y frontend de inventario/catologos reales.
- Archivo Prisma principal: `D:\silab\schema_silab_fci.prisma`.
- Base de datos PostgreSQL configurada: `silab_bd`.
- El schema Prisma fue validado correctamente con Prisma CLI.
- Se creo y aplico la migracion inicial sobre `silab_bd`.
- Se ejecuto seed inicial de roles y permisos.

## Modelo detectado

El schema contiene entidades para estructura academica, usuarios y roles, laboratorios, ubicaciones, categorias de equipos, inventario, materias, proyectos, actividades, prestamos, devoluciones, movimientos de inventario, mantenimientos, archivos y auditoria.

## Decisiones tecnicas preliminares

- Backend seleccionado: NestJS con Prisma, PostgreSQL, JWT previsto, guards por rol previstos y validacion con class-validator/Zod.
- Frontend seleccionado: React, Vite, TypeScript, TailwindCSS, Shadcn UI, TanStack Query, TanStack Table previsto y Recharts.
- Separacion del repositorio: carpetas `backend/` y `frontend/`.

## Mejoras aplicadas al modelo Prisma

- Se agregaron enums para tipos y estados del dominio: usuarios, ubicaciones, equipos, proyectos, actividades, uso, prestamos, condiciones, movimientos, mantenimiento y archivos.
- Se agrego `passwordHash` a `Usuario` para autenticacion.
- Se agregaron `Permiso`, `RolPermiso` y `RefreshToken`.
- `Usuario.programaId` paso a ser opcional y se agrego `facultadId` opcional para roles como administrador, decano y coordinacion.
- Se agregaron responsables para equipos y laboratorios.
- Se agrego `EquipoUnidad` para controlar seriales individuales cuando un equipo tiene varias unidades fisicas.
- Se agregaron campos de cantidades mas completos en `Equipo`: disponible, prestada, mantenimiento y baja.
- Se agrego `DevolucionDetalle` para registrar devoluciones por item, cantidades y estado de recepcion.
- Se agregaron campos de aprobacion, rechazo y entrega en `Prestamo`.
- Se agregaron relaciones opcionales desde movimientos hacia prestamos, devoluciones, mantenimientos y ubicaciones origen/destino.
- Se agregaron `createdAt`, `updatedAt` y `deletedAt` donde aplica.
- Se agregaron indices, restricciones unicas y campos de auditoria extendidos.
- El datasource fue ajustado al formato de Prisma 7; la URL de conexion debera definirse en `prisma.config.ts` durante la fase 1.

## Proximo paso

Iniciar fase 4 cuando el usuario lo autorice: prestamos, aprobaciones, entregas y devoluciones.

## Fase 1 completada

- Se creo workspace npm raiz con scripts para backend, frontend, Prisma, build y lint.
- Se creo `backend/` con NestJS, ConfigModule, validacion de entorno, filtro global de errores, PrismaModule y PrismaService.
- Se configuro Prisma 7 con `backend/prisma.config.ts`.
- Se agrego adapter PostgreSQL `@prisma/adapter-pg` y `pg` para inicializar PrismaClient en Prisma 7.
- Se creo `backend/.env.example` y `backend/.env` usando `silab_bd`.
- Se creo migracion inicial en `backend/prisma/migrations/20260602145037_init/migration.sql`.
- Se creo seed inicial en `backend/prisma/seed.ts`.
- Se creo `frontend/` con React, Vite, TypeScript, TailwindCSS, Shadcn UI base, TanStack Query, React Router y Recharts.
- Se creo layout inicial con navegacion y dashboard base.
- Se dividieron chunks de frontend para evitar advertencias de bundle inicial grande.
- Se agrego navegacion inferior para viewport movil.

## Validaciones ejecutadas

- `npm.cmd run prisma:validate`: correcto.
- `npm.cmd run prisma:generate`: correcto.
- `npm.cmd run prisma:migrate:dev --workspace @silab/backend -- --name init`: correcto, aplicado a `silab_bd`.
- `npm.cmd run seed --workspace @silab/backend`: correcto.
- `npm.cmd run lint`: correcto.
- `npm.cmd run build`: correcto.
- Backend iniciado en desarrollo y verificado con `GET http://localhost:3000/api/v1/health`.
- Frontend iniciado en desarrollo y verificado en `http://localhost:5173/` con navegador integrado.
- Navegacion movil probada hacia `/inventory` sin errores de consola.
- `npm.cmd audit --omit=dev`: reporta 3 vulnerabilidades moderadas provenientes del CLI de Prisma 7; `npm audit fix --force` propone bajar Prisma a 6.19.3, por lo que no se aplico.

## Fase 2 completada

- Se reviso la carpeta `D:\silab\plataforma silabfci (ejemplo frontend)` para tomar referencia visual de login, shell y navegacion.
- No se uso `data.js` ni datos simulados del ejemplo.
- Se agrego autenticacion JWT en backend con `@nestjs/jwt`.
- Se agrego hashing de contrasenas con `bcryptjs`.
- Se agregaron guards globales `JwtAuthGuard` y `PermissionsGuard`.
- Se agregaron decoradores `@Public`, `@Permissions` y `@CurrentUser`.
- Se implementaron rutas reales:
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/me`
  - `GET/POST/PATCH/DELETE /api/v1/users`
  - `GET /api/v1/roles`
  - `GET /api/v1/permissions`
  - `GET /api/v1/faculties`
  - `GET /api/v1/programs`
- Se actualizo el seed para asignar permisos por rol y crear un administrador inicial.
- Credenciales bootstrap de desarrollo:
  - Correo: `admin@silabfci.local`
  - Contrasena: `Admin12345*`
- Se copio el logo institucional del ejemplo a `frontend/public/assets/`.
- Se implemento login real en frontend contra `/auth/login`.
- Se implemento persistencia de token de acceso y refresh mediante cookie httpOnly.
- Se protegio la aplicacion con rutas privadas.
- Se adapto el shell visual al estilo de la plataforma de ejemplo.
- Se implemento pagina real de usuarios conectada a PostgreSQL mediante API, con listado, busqueda, formulario de creacion y activacion/desactivacion.
- Se verifico en navegador integrado el login y la pagina `/users`, mostrando el admin real desde `silab_bd`.
- Se ajusto `backend/tsconfig.build.json` para que Nest compile `backend/dist/main.js` y el modo watch quede estable.

## Validaciones fase 2

- `npm.cmd run seed --workspace @silab/backend`: correcto.
- Login real con `admin@silabfci.local`: correcto.
- Consulta protegida `GET /api/v1/users`: correcto.
- Consulta protegida `GET /api/v1/roles`: correcto.
- `npm.cmd run prisma:validate`: correcto.
- `npm.cmd run lint`: correcto.
- `npm.cmd run build`: correcto.
- `GET http://localhost:3000/api/v1/health` posterior al build: correcto.

## Fase 3 completada

- Se implemento modulo backend `LaboratoriesModule` para laboratorios y ubicaciones.
- Se implementaron DTOs con `class-validator` para creacion, actualizacion y filtros.
- Se implementaron rutas reales protegidas con `laboratorios:gestionar`:
  - `GET/POST /api/v1/laboratories`
  - `GET/PATCH/DELETE /api/v1/laboratories/:id`
  - `GET/POST /api/v1/locations`
  - `GET /api/v1/locations/tree`
  - `GET/PATCH/DELETE /api/v1/locations/:id`
- Se implemento modulo backend `InventoryModule` para categorias, equipos, unidades y movimientos.
- Se implementaron rutas reales protegidas con `inventario:gestionar`:
  - `GET/POST /api/v1/equipment-categories`
  - `PATCH/DELETE /api/v1/equipment-categories/:id`
  - `GET/POST /api/v1/equipment`
  - `GET/PATCH/DELETE /api/v1/equipment/:id`
  - `GET/POST /api/v1/equipment/:id/units`
  - `PATCH/DELETE /api/v1/equipment-units/:id`
  - `GET /api/v1/inventory-movements`
  - `POST /api/v1/inventory-movements/entry`
  - `POST /api/v1/inventory-movements/adjustment`
  - `POST /api/v1/inventory-movements/transfer`
- Se agregaron reglas de negocio para cantidades no negativas, entradas, ajustes positivos/negativos, bajas, traslados agregados completos y traslados serializados por unidad.
- Se usan transacciones Prisma en creacion de equipos, creacion/baja de unidades y movimientos de inventario.
- Se agregaron paginas frontend reales:
  - `frontend/src/pages/inventory-page.tsx`
  - `frontend/src/pages/equipment-page.tsx`
  - `frontend/src/pages/categories-page.tsx`
  - `frontend/src/pages/laboratories-page.tsx`
  - `frontend/src/pages/locations-page.tsx`
- Se agregaron tipos frontend reales en `frontend/src/types/inventory.ts`.
- Se conectaron las rutas del frontend y se retiro el placeholder de inventario, equipos, categorias, laboratorios y ubicaciones.
- Se ajusto la navegacion para mostrar inventario/categorias/equipos solo con `inventario:gestionar` y laboratorios/ubicaciones solo con `laboratorios:gestionar`.
- No se usaron datos simulados del frontend de ejemplo ni se sembraron equipos/laboratorios ficticios.
- La base `silab_bd` no tiene facultades cargadas al cierre de esta fase; por eso laboratorios dependen de cargar primero estructura academica real.

## Validaciones fase 3

- `npm.cmd run prisma:validate`: correcto.
- `npm.cmd run lint --workspace @silab/backend`: correcto.
- `npm.cmd run build --workspace @silab/backend`: correcto.
- `npm.cmd run lint --workspace @silab/frontend`: correcto.
- `npm.cmd run build --workspace @silab/frontend`: correcto.
- Backend iniciado en desarrollo y rutas nuevas mapeadas por NestJS.
- Frontend iniciado en `http://localhost:5173/`.
- Login real con `admin@silabfci.local`: correcto.
- Consultas protegidas a categorias, laboratorios, ubicaciones, equipos y movimientos: correcto.
- Navegador integrado verifico `/inventory`, `/equipment`, `/categories`, `/labs` y `/locations` sin errores de consola.

## Ajuste de alcance por facultad

- Se aclaro la regla funcional: SILAB FCI opera actualmente para la Facultad de Ciencias e Ingenieria, pero el modelo conserva `Facultad` para escalar a otras facultades en el futuro.
- Se agrego seed institucional de la facultad FCI:
  - Nombre: `Facultad de Ciencias e Ingenieria`
  - Sigla: `FCI`
- Se agregaron rutas de gestion de facultades:
  - `GET /api/v1/faculties`
  - `POST /api/v1/faculties`
  - `PATCH /api/v1/faculties/:id`
  - `DELETE /api/v1/faculties/:id`
- La creacion, edicion y eliminacion de facultades queda reservada para un administrador global sin `facultadId` asignada.
- Se agrego helper comun `backend/src/common/faculty-scope.ts` para resolver alcance por facultad desde el JWT.
- Se aplico alcance por facultad en:
  - Facultades y programas visibles.
  - Usuarios listados, creados y actualizados.
  - Laboratorios creados, listados, editados y eliminados.
  - Ubicaciones creadas, listadas, editadas y eliminadas.
  - Equipos, unidades y movimientos de inventario.
- Un usuario con `facultadId` asignada solo puede operar recursos de su facultad.
- Un administrador global sin `facultadId` queda como perfil preparado para futura administracion multi-facultad.
- Se agrego pagina frontend `frontend/src/pages/faculties-page.tsx`.
- Se agrego ruta frontend `/faculties` y navegacion bajo Academico.
- El formulario de laboratorios selecciona automaticamente FCI cuando es la unica facultad visible.
- El formulario de usuarios selecciona automaticamente FCI cuando es la unica facultad visible.

## Validaciones ajuste de facultad

- `npm.cmd run lint --workspace @silab/backend`: correcto.
- `npm.cmd run build --workspace @silab/backend`: correcto.
- `npm.cmd run lint --workspace @silab/frontend`: correcto.
- `npm.cmd run build --workspace @silab/frontend`: correcto.
- `npm.cmd run seed --workspace @silab/backend`: correcto, FCI creada en `silab_bd`.
- Login real con `admin@silabfci.local`: correcto.
- `GET /api/v1/faculties`: correcto, devuelve FCI.
- `GET /api/v1/laboratories`, `GET /api/v1/locations` y `GET /api/v1/equipment`: correcto con la nueva logica de alcance.
- El navegador integrado no permitio escribir en los campos de login durante esta verificacion por una limitacion del conector de navegador, pero Vite recargo los cambios y la validacion API/build quedo correcta.

## Fase 4 completada

- Se implemento modulo backend `LoansModule` para prestamos, aprobaciones, entregas y devoluciones.
- Se agregaron DTOs con `class-validator` para solicitud, filtros, aprobacion, rechazo, entrega y devolucion.
- Se implementaron rutas reales protegidas por permisos:
  - `GET /api/v1/loans`
  - `POST /api/v1/loans` con `prestamos:solicitar`
  - `GET /api/v1/loans/:id`
  - `PATCH /api/v1/loans/:id/approve` con `prestamos:aprobar`
  - `PATCH /api/v1/loans/:id/reject` con `prestamos:aprobar`
  - `PATCH /api/v1/loans/:id/deliver` con `prestamos:entregar`
  - `POST /api/v1/loans/:id/returns` con `devoluciones:registrar`
  - `GET /api/v1/returns`
- Se agregaron reglas de negocio para:
  - Validar disponibilidad al solicitar/aprobar/entregar.
  - Exigir unidad fisica cuando el equipo requiere serial.
  - Cambiar cantidades de equipos al entregar y devolver.
  - Marcar unidades como `PRESTADO`, `DISPONIBLE`, `DANADO` o `PERDIDO` segun el flujo.
  - Registrar movimientos `PRESTAMO` y `DEVOLUCION` en inventario.
  - Manejar estados `SOLICITADO`, `APROBADO`, `RECHAZADO`, `ENTREGADO`, `DEVUELTO_PARCIAL`, `DEVUELTO` y `VENCIDO`.
- Se aplico alcance por facultad en consultas y operaciones de prestamos/devoluciones segun los equipos asociados.
- Se agrego pagina frontend real `frontend/src/pages/loans-page.tsx`.
- Se agregaron tipos frontend reales en `frontend/src/types/loans.ts`.
- Se conectaron las rutas `/loans` y `/returns`, retirando placeholders.
- Se ajusto la navegacion para mostrar prestamos a usuarios con permisos de solicitar, aprobar o entregar, y devoluciones a usuarios con permiso de registrar devoluciones.
- Se creo `backend/.env` desde `backend/.env.example` para permitir la generacion local de Prisma.

## Validaciones fase 4

- `npm.cmd install`: correcto; reporta 3 vulnerabilidades moderadas ya conocidas del ecosistema Prisma.
- `npm.cmd run prisma:generate`: correcto.
- `npm.cmd run lint --workspace @silab/backend`: correcto.
- `npm.cmd run build --workspace @silab/backend`: correcto.
- `npm.cmd run lint --workspace @silab/frontend`: correcto.
- `npm.cmd run build --workspace @silab/frontend`: correcto.
