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

## Ajuste de tipos de ubicacion

- Se agregaron niveles fisicos para jerarquia de ubicaciones:
  - `NIVEL`
  - `CAJON`
  - `CAJA`
  - `SALON`
- Se actualizo `TipoUbicacion` en `schema_silab_fci.prisma`.
- Se actualizo el frontend en `frontend/src/types/inventory.ts` y `frontend/src/pages/locations-page.tsx`.
- Se agregaron migraciones:
  - `backend/prisma/migrations/20260603235438_add_location_sublevels/migration.sql`
  - `backend/prisma/migrations/20260604191000_add_salon_location_type/migration.sql`
- Se aplicaron las migraciones en la base remota `siilab_fci_dev` en `10.60.15.10:5432`, schema `public`.
- Se regenero Prisma Client.

## Validaciones ajuste de ubicaciones

- `npm.cmd run prisma:validate`: correcto.
- `npm.cmd run prisma:generate`: correcto.
- `npm.cmd run prisma:migrate:dev --workspace @silab/backend -- --name add_salon_location_type`: correcto.
- `npm.cmd run lint --workspace @silab/backend`: correcto.
- `npm.cmd run build --workspace @silab/backend`: correcto.
- `npm.cmd run lint --workspace @silab/frontend`: correcto.
- `npm.cmd run build --workspace @silab/frontend`: correcto.

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

## Ajuste de equipos escaneables y CRUD

- Se agrego soporte de identificadores escaneables en `Equipo`:
  - `codigoBarras` opcional para equipos que ya traen etiqueta fisica.
  - `qrToken` obligatorio y unico para que cada equipo tenga un identificador QR propio del sistema.
- Se creo y aplico la migracion `20260604201000_add_equipment_barcode_qr` sobre PostgreSQL `siilab_fci_dev`, schema `public`.
- La migracion rellena `qrToken` para equipos existentes antes de marcarlo obligatorio.
- Se actualizo el backend de inventario para:
  - Crear automaticamente `qrToken` al registrar equipos nuevos.
  - Registrar y editar `codigoBarras`.
  - Buscar equipos por codigo interno, codigo de barras, QR, codigo de unidad o serial.
  - Exponer `GET /api/v1/equipment/lookup?code=...` para futuras pantallas moviles, prestamos y devoluciones con escaner.
- Se actualizo la pantalla `Equipos` para:
  - Registrar codigo de barras.
  - Mostrar identificadores de barras y QR en la tabla.
  - Editar equipos existentes desde la tabla.
  - Eliminar equipos existentes con las reglas actuales del backend.
  - Mantener bloqueada la edicion de cantidades iniciales para que el inventario siga controlado por movimientos.

## Validaciones ajuste de equipos escaneables

- `npm.cmd run prisma:validate`: correcto.
- `npm.cmd run prisma:migrate:dev --workspace @silab/backend -- --name add_equipment_barcode_qr`: correcto.
- `npm.cmd run prisma:generate`: correcto.
- `npm.cmd run lint --workspace @silab/backend`: correcto.
- `npm.cmd run build --workspace @silab/backend`: correcto.
- `npm.cmd run lint --workspace @silab/frontend`: correcto.
- `npm.cmd run build --workspace @silab/frontend`: correcto.
- Login real con `admin@silabfci.local` y verificacion de `/equipment` en navegador integrado: correcto.
- `GET /api/v1/equipment/lookup?code=SILAB-FCI:EQUIPO:<qrToken>`: correcto.

## Revision de arranque 2026-06-09

- Se reprodujo el error al correr el proyecto.
- Causa principal backend: Prisma Client estaba desactualizado frente al schema actual, por eso TypeScript no encontraba modelos y enums nuevos como `PersonaPrestamo`, `ConfiguracionSistema` y `SolicitudPublicaPrestamo`.
- Causa principal frontend/backend reportes: las dependencias `qrcode` y `jsbarcode` estaban declaradas, pero no instaladas fisicamente en `node_modules`.
- Se ejecuto `npm.cmd run prisma:generate` para regenerar Prisma Client.
- Se ejecuto `npm.cmd install` para sincronizar dependencias locales.
- Se verifico que la base remota `siilab_fci_dev`, schema `public`, esta al dia con 8 migraciones.
- Se verifico arranque real del backend con `npm.cmd run dev:backend`: compila en watch con 0 errores y Nest inicia correctamente.
- Se verifico que el frontend responde en `http://localhost:5173` con titulo `SILAB FCI`.

## Validaciones revision de arranque 2026-06-09

- `npm.cmd run prisma:validate`: correcto.
- `npm.cmd run prisma:generate`: correcto.
- `npm.cmd install`: correcto; reporta 3 vulnerabilidades moderadas ya conocidas.
- `npm.cmd run build --workspace @silab/backend`: correcto.
- `npm.cmd run build --workspace @silab/frontend`: correcto.
- `npm.cmd run lint --workspace @silab/backend`: correcto.
- `npm.cmd run lint --workspace @silab/frontend`: correcto.
- `npx.cmd prisma migrate status --schema ../schema_silab_fci.prisma` desde `backend/`: correcto, base al dia.

## Cierre real de fase 4: mantenimiento

- Se completo el alcance pendiente de fase 4 agregando modulo backend `MaintenanceModule`.
- Se implementaron DTOs para crear, listar y cerrar mantenimientos.
- Se implementaron rutas reales protegidas con `mantenimiento:gestionar`:
  - `GET /api/v1/maintenance`
  - `POST /api/v1/maintenance`
  - `GET /api/v1/maintenance/:id`
  - `PATCH /api/v1/maintenance/:id/start`
  - `PATCH /api/v1/maintenance/:id/close`
  - `PATCH /api/v1/maintenance/:id/cancel`
- Se agregaron reglas de negocio para:
  - Enviar equipos agregados o unidades fisicas a mantenimiento.
  - Abrir mantenimiento sobre items agregados ya retenidos en `cantidadMantenimiento` por devoluciones con dano.
  - Exigir unidad cuando el equipo requiere serial.
  - Bloquear unidades prestadas, en mantenimiento, dadas de baja, perdidas o inactivas.
  - Descontar disponibilidad e incrementar cantidad en mantenimiento al registrar el ingreso.
  - Cerrar mantenimiento como disponible, danado/incompleto o perdido.
  - Cancelar mantenimiento devolviendo el item a disponible.
  - Registrar movimientos `MANTENIMIENTO_ENTRADA` y `MANTENIMIENTO_SALIDA`.
- Se aplico alcance por facultad en consultas y operaciones de mantenimiento.
- Se agrego pagina frontend real `frontend/src/pages/maintenance-page.tsx`.
- Se agregaron tipos frontend reales en `frontend/src/types/maintenance.ts`.
- Se conecto la ruta `/maintenance`, retirando el placeholder.
- Se ajusto la navegacion para mostrar mantenimientos solo con permiso `mantenimiento:gestionar`.
- Con este cierre, fase 4 queda completa y el siguiente paso recomendado es fase 5: reportes PDF/Excel y actas.

## Validaciones cierre fase 4

- `npm run lint --workspace @silab/backend`: correcto.
- `npm run lint --workspace @silab/frontend`: correcto.
- `npm run build`: correcto.

## Fase 5 completada: reportes PDF/Excel y actas

- Se implemento modulo backend `ReportsModule`.
- Se agregaron generadores internos sin dependencias externas para:
  - Archivos `.xlsx` de una hoja compatibles con Excel.
  - Archivos `.pdf` textuales para reportes y actas.
- Se implementaron rutas protegidas con `reportes:ver`:
  - `GET /api/v1/reports/inventory.xlsx`
  - `GET /api/v1/reports/inventory.pdf`
  - `GET /api/v1/reports/loans.xlsx`
  - `GET /api/v1/reports/loans.pdf`
  - `GET /api/v1/reports/maintenance.xlsx`
  - `GET /api/v1/reports/maintenance.pdf`
  - `GET /api/v1/reports/acts/loans/:id.pdf`
  - `GET /api/v1/reports/acts/returns/:id.pdf`
- Se aplico alcance por facultad en reportes de inventario, prestamos, mantenimientos y actas.
- Los reportes de inventario incluyen codigos, categoria, marca/modelo, cantidades, estado, responsable y ruta completa de ubicacion.
- Los reportes de prestamos exportan una fila por item de prestamo con solicitante, estado, fechas y cantidades.
- Los reportes de mantenimiento exportan estado, tipo, equipo, unidad, responsable, fechas y observaciones.
- Las actas PDF incluyen datos generales, detalle de equipos y espacios de firma.
- Se agrego helper frontend `downloadApiFile` para descargar binarios autenticados con JWT.
- Se agrego pagina frontend real `frontend/src/pages/reports-page.tsx`.
- Se conecto la ruta `/reports`, retirando el placeholder.
- Se ajusto la navegacion para mostrar reportes solo con permiso `reportes:ver`.

## Validaciones fase 5

- `npm run lint --workspace @silab/backend`: correcto.
- `npm run lint --workspace @silab/frontend`: correcto.
- `npm run build`: correcto.

## Ajuste de formato PDF de inventario

- Se reviso `data/Reporte de Inventario SIILAB FCI.html` como referencia visual del reporte institucional.
- Se adapto `GET /api/v1/reports/inventory.pdf` para usar un formato PDF visual inspirado en ese HTML:
  - Cabecera verde institucional con marca SIILAB FCI.
  - Codigo de reporte.
  - Metadatos de generacion, usuario, alcance y cantidad de referencias.
  - Tarjetas de resumen ejecutivo.
  - Barra de distribucion por disponibilidad, prestamo, mantenimiento y baja.
  - Tabla con codigo, equipo, categoria, estado, disponibilidad y ruta de ubicacion.
  - Footer institucional y paginacion.
- El PDF usa datos reales de PostgreSQL mediante `ReportsService.getInventoryRows`.
- Las ubicaciones se imprimen con ruta jerarquica completa usando los registros de `Ubicacion`.

## Validaciones ajuste PDF inventario

- `npm run lint --workspace @silab/backend`: correcto.
- `npm run build`: correcto.

## Ajuste de margenes, marca y QR de verificacion

- Se ajusto el PDF de inventario para evitar desbordes de texto en cabecera, metadatos, tabla y footer.
- Se redujo el bloque de marca del encabezado a un simbolo limpio tipo Universidad, evitando que el texto del logo se corte.
- Se agregaron limites de ancho y truncado controlado para textos largos.
- Se agrego un QR vectorial pequeño al footer del PDF.
- El QR apunta a `/verify-report/:code`, una pagina publica del frontend que muestra el codigo de verificacion y confirma que el documento fue generado desde SIILAB FCI.
- Se agrego dependencia backend `qrcode` para construir la matriz QR real dentro del PDF.
- Se agrego pagina frontend `frontend/src/pages/verify-report-page.tsx`.

## Validaciones ajuste QR PDF

- `npm run lint --workspace @silab/backend`: correcto.
- `npm run lint --workspace @silab/frontend`: correcto.
- `npm run build`: correcto.

## Ajuste visual adicional del PDF de inventario

- Se amplio el panel derecho del encabezado para que `Reporte / Inventario de equipos` quede dentro del bloque verde.
- Se amplio el recuadro verde claro del codigo de reporte para evitar cortes.
- Se fijo el encabezado institucional a `Facultad de Ciencias e Ingenieria`, porque el sistema esta trabajando solo con FCI.
- Se reemplazaron varios cortes con `...` por saltos de linea controlados en metadatos, encabezado, filas y ubicaciones.
- Se bajo la tabla para separar mejor porcentajes y encabezados.
- Se aumento la altura de filas y se redujo la cantidad de filas por pagina para evitar que la tabla invada el footer.
- Se aumento el QR de verificacion y se movio el texto de codigo/pagina hacia la izquierda.

## Validaciones ajuste visual PDF inventario

- `npm run lint --workspace @silab/backend`: correcto.
- `npm run build`: correcto.

## Ajuste de entorno de desarrollo con recarga automatica

- Se agrego script raiz `npm run dev` para levantar backend y frontend al mismo tiempo.
- Se agrego `concurrently` como dependencia de desarrollo en la raiz.
- El backend sigue usando `nest start --watch` mediante `npm run dev:backend`.
- Se agregaron `watchOptions` en `backend/tsconfig.json` para mejorar la deteccion de cambios guardados.
- Se configuro `server.watch` con polling en `frontend/vite.config.ts` para HMR estable.
- Flujo recomendado:
  - Ejecutar una sola vez `npm run dev`.
  - Guardar cambios en backend o frontend.
  - Nest reinicia el backend automaticamente.
  - Vite actualiza el frontend automaticamente en el navegador.

## Validaciones ajuste entorno desarrollo

- `npm run build`: correcto.
- `npm run lint --workspace @silab/frontend`: correcto.

## Ajuste estilo login en cabecera de PDF inventario

- Se redisenio la parte superior de `GET /api/v1/reports/inventory.pdf` para acercarla al estilo del login.
- Se agrego fondo verde moderno con patron de puntos y lineas tipo circuito.
- Se separo visualmente `SILAB` y `FCI`, usando acento verde lima como en el login.
- Se reemplazo la marca plana del encabezado por el logo original dentro de bloque blanco.
- Se ajusto el bloque derecho de `REPORTE / Inventario de equipos` con verdes de mayor contraste y codigo en verde claro.
- Se mantuvo el texto de facultad y universidad dentro del area verde para evitar que invada el cuerpo blanco del reporte.
- Se ajusto nuevamente el encabezado para incrustar el archivo real `frontend/public/assets/logo-mark.png`, el mismo usado en la pagina de login.
- Se agrego soporte interno para leer PNG RGBA e incrustarlo como imagen PDF con transparencia.

## Validaciones ajuste cabecera PDF inventario

- `npm run lint --workspace @silab/backend`: correcto.
- `npm run build --workspace @silab/backend`: correcto.
- PDF de prueba generado correctamente con recurso `/Logo` incluido.

## Ajuste formato PDF para prestamos y mantenimientos

- Se agrego generador reutilizable `createTableReportPdf` para reportes tabulares con el mismo estilo del PDF de inventario.
- `GET /api/v1/reports/loans.pdf` ahora usa:
  - Cabecera verde moderna con patron tipo circuito.
  - Logo original `logo-mark.png`.
  - Codigo de reporte `REP-PRE-*`.
  - Metadatos de generacion, usuario, alcance y registros.
  - Resumen ejecutivo de prestamos, items, pendientes, activos y cerrados.
  - Tabla con prestamo, estado, solicitante, equipo, cantidad, vencimiento y ubicacion jerarquica.
  - Footer con QR de verificacion.
- `GET /api/v1/reports/maintenance.pdf` ahora usa:
  - El mismo formato institucional.
  - Codigo de reporte `REP-MAN-*`.
  - Resumen de registros, abiertos, cerrados y cancelados.
  - Tabla con ID, estado, tipo, equipo, responsable, inicio y ubicacion jerarquica.
  - Footer con QR de verificacion.

## Validaciones ajuste PDF prestamos/mantenimientos

- `npm run lint --workspace @silab/backend`: correcto.
- `npm run build --workspace @silab/backend`: correcto.
- PDF tabular de prueba generado correctamente con recurso `/Logo` incluido.

## Formulario publico de solicitud de prestamo

- Se agrego entidad `SolicitudPublicaPrestamo` en `schema_silab_fci.prisma`.
- Se agrego enum `EstadoSolicitudPublicaPrestamo` con estados `RECIBIDA`, `EN_REVISION`, `CONVERTIDA`, `RECHAZADA` y `CANCELADA`.
- Se agrego migracion `backend/prisma/migrations/20260605093000_add_public_loan_requests/migration.sql`.
- Se creo DTO backend `CreatePublicLoanRequestDto` con validacion de:
  - Nombre completo.
  - Correo institucional `@umanizales.edu.co`.
  - Codigo del equipo, recurso o infraestructura.
  - Fecha requerida de prestamo.
  - Fecha estimada de devolucion.
  - Descripcion de la actividad.
- Se agrego endpoint publico:
  - `POST /api/v1/public/loan-requests`
- El backend calcula y guarda `diasPrestamo`, valida que la fecha de prestamo no sea anterior a hoy y que la devolucion sea igual o posterior.
- Se creo pagina frontend publica `frontend/src/pages/public-loan-request-page.tsx`.
- Se agrego ruta publica `/solicitar-prestamo`.
- La pagina calcula automaticamente la duracion del prestamo en dias segun las fechas seleccionadas.
- Se agrego enlace desde el login hacia el formulario publico.

## Validaciones formulario publico de prestamo

- `npm run prisma:validate`: correcto.
- `npm run prisma:generate`: correcto.
- `npm run lint --workspace @silab/backend`: correcto.
- `npm run build --workspace @silab/backend`: correcto.
- `npm run lint --workspace @silab/frontend`: correcto.
- `npm run build --workspace @silab/frontend`: correcto.
- `npx prisma db push --schema ../schema_silab_fci.prisma` no se pudo aplicar desde esta sesion: Prisma detecto la base remota `siilab_fci_dev` en `10.60.15.10:5432`, pero devolvio `Schema engine error` sin detalle tambien en `migrate status`.

## Ajuste de selector publico de equipos prestables

- Se reemplazo el campo libre de codigo en `/solicitar-prestamo` por un selector buscable.
- Se agrego endpoint publico:
  - `GET /api/v1/public/loan-resources`
- El selector lista equipos disponibles para prestamo usando `cantidadDisponible > 0` y estado `DISPONIBLE`.
- El buscador filtra por nombre, codigo, categoria y laboratorio.
- La solicitud publica guarda `equipoId` cuando el usuario selecciona un equipo real.
- Se agrego la opcion `El equipo o infraestructura no esta en la lista`.
- Al escoger esa opcion se despliega un campo para describir lo que necesita el solicitante.
- Ese caso queda como solicitud especial para que coordinacion revise si existe con otro nombre, si se maneja como prestamo especial o si se rechaza con nota.
- Se agregaron endpoints internos protegidos con `prestamos:aprobar`:
  - `GET /api/v1/loan-requests`
  - `PATCH /api/v1/loan-requests/:id/status`
- Coordinacion puede marcar solicitudes publicas como `EN_REVISION` o `RECHAZADA`.
- Al rechazar una solicitud publica, el backend exige una nota interna.
- Se agrego una bandeja de `Solicitudes publicas` dentro de la pagina interna de prestamos.

## Validaciones ajuste selector publico

- `npm run prisma:format`: correcto.
- `npm run prisma:validate`: correcto.
- `npm run prisma:generate`: correcto.
- `npm run lint --workspace @silab/backend`: correcto.
- `npm run lint --workspace @silab/frontend`: correcto.
- `npm run build --workspace @silab/backend`: correcto.
- `npm run build --workspace @silab/frontend`: correcto.

## Ajuste previo a fase 7: devoluciones, actas firmadas y correo

- Se intento aplicar migracion Prisma con `npx prisma migrate deploy --schema ../schema_silab_fci.prisma`.
- Prisma sigue detectando la base remota `siilab_fci_dev` en `10.60.15.10:5432`, pero falla con `Schema engine error`.
- Por instruccion del usuario, las migraciones quedan pendientes de aplicar en base de datos.
- Se agrego boton `Copiar link formulario` en la pagina interna de prestamos.
- Se amplio el modelo de devoluciones con evidencias:
  - Fotos de equipos devueltos.
  - Firma de coordinacion.
  - Firma del administrador del sistema.
  - Firma del solicitante.
- Se agrego modelo `DevolucionEvidencia` y enum `TipoEvidenciaDevolucion`.
- Se agrego vista protegida `/returns/:id/acta` para visualizar el acta de devolucion.
- La vista de acta permite:
  - Imprimir desde navegador.
  - Descargar PDF usando el endpoint existente de reportes.
  - Enviar por correo usando SMTP configurado.
- El registro de devolucion ahora exige al menos una foto y las tres firmas.
- Se agrego modulo `MailModule` con cliente SMTP interno.
- Se agrego modulo `SettingsModule`.
- Se agrego pagina real `/settings` para configurar:
  - SMTP Google.
  - SMTP Outlook.
  - SMTP personalizado.
  - Plantilla de acta de devolucion.
  - Plantilla de aviso de prestamo por vencer.
  - Plantilla de solicitud publica aprobada.
- Se agrego endpoint `POST /api/v1/returns/:id/act/email` para enviar actas de devolucion.
- Se agrego endpoint `POST /api/v1/loans/:id/due-soon-email` para enviar aviso manual de prestamo proximo a vencer.
- Al marcar una solicitud publica como `CONVERTIDA`, el backend envia correo de aprobacion al correo registrado y usa la nota interna como mensaje adicional.

## Validaciones ajuste devoluciones/correo

- `npm run prisma:format`: correcto.
- `npm run prisma:validate`: correcto.
- `npm run prisma:generate`: correcto.
- `npm run lint --workspace @silab/backend`: correcto.
- `npm run lint --workspace @silab/frontend`: correcto.
- `npm run build --workspace @silab/backend`: correcto.
- `npm run build --workspace @silab/frontend`: correcto.
- `npx prisma migrate deploy --schema ../schema_silab_fci.prisma`: pendiente por `Schema engine error`.

## Ajuste registro manual de prestamos

- Se ajusto el flujo de registro interno de prestamos para que admin/coordinacion pueda registrar prestamos a nombre de otra persona.
- Se agrego campo `fechaRequerida` al modelo `Prestamo`.
- Se agregaron campos manuales para solicitantes que no son usuarios del sistema:
  - `solicitanteNombre`
  - `solicitanteCorreo`
  - `solicitanteDocumento`
- `usuarioSolicitanteId` ahora puede ser nulo.
- En el formulario interno de prestamos se agrego modo de solicitante:
  - Seleccionar usuario del sistema.
  - Registrar datos manualmente.
- Se agregaron fecha requerida, devolucion estimada y calculo de dias.
- Se cambio el campo `Observaciones` a `Descripcion de la actividad / observaciones`.
- Reportes, actas y correos ahora usan el usuario del sistema si existe o los datos manuales como fallback.
- Se agrego migracion `backend/prisma/migrations/20260606113000_add_required_date_to_loans/migration.sql`.

## Validaciones ajuste registro manual de prestamos

- `npm run prisma:format`: correcto.
- `npm run prisma:validate`: correcto.
- `npm run prisma:generate`: correcto.
- `npm run lint --workspace @silab/backend`: correcto.
- `npm run lint --workspace @silab/frontend`: correcto.
- `npm run build --workspace @silab/backend`: correcto.
- `npm run build --workspace @silab/frontend`: correcto.
- `npx prisma migrate deploy --schema ../schema_silab_fci.prisma`: pendiente por `Schema engine error` desde esta sesion.

## Ajuste trazabilidad de personas para prestamos

- Se agrego entidad `PersonaPrestamo` para registrar personas que pueden solicitar prestamos sin ser usuarios con login.
- Campos incluidos:
  - Codigo.
  - Nombre.
  - Correo institucional.
  - Carrera.
  - Semestre para estudiantes.
  - Rol: estudiante, profesor o administrativo.
  - Estado activo/inactivo.
- Se agrego enum `RolPersonaPrestamo`.
- Se relaciono `Prestamo` con `personaSolicitanteId`.
- Se agrego migracion `backend/prisma/migrations/20260606123000_add_people_for_loans/migration.sql`.
- Se agrego modulo backend `/people` con:
  - CRUD basico.
  - Filtro por rol, semestre, carrera, estado y busqueda por codigo/nombre/correo.
  - Resumen de estudiantes, profesores y administrativos activos.
  - Carga masiva CSV con upsert por codigo.
  - Eliminacion logica/desactivacion cuando la persona tiene historial de prestamos.
- Se agrego pagina protegida `/people` en Administracion > Personas.
- La pagina permite:
  - Ver metricas superiores por rol.
  - Buscar por codigo, nombre o correo.
  - Filtrar por rol, carrera, semestre y estado.
  - Crear y editar personas en modal.
  - Subir CSV.
  - Descargar formato CSV con columnas y filas de ejemplo.
  - Eliminar o desactivar segun historial.
- El formulario interno de prestamos ahora permite:
  - Seleccionar persona activa registrada.
  - Buscar personas por codigo, nombre o correo.
  - Crear una persona nueva durante el registro del prestamo si no existe.
- Reportes, actas y correos ahora priorizan `personaSolicitante` antes que usuario interno o campos manuales antiguos.

## Validaciones ajuste personas para prestamos

- `npm run prisma:format --workspace @silab/backend`: correcto.
- `npm run prisma:validate --workspace @silab/backend`: correcto.
- `npm run prisma:generate --workspace @silab/backend`: correcto.
- `npm run lint --workspace @silab/backend`: correcto.
- `npm run lint --workspace @silab/frontend`: correcto.
- `npm run build --workspace @silab/backend`: correcto.
- `npm run build --workspace @silab/frontend`: correcto.
- `npx prisma migrate deploy --schema ../schema_silab_fci.prisma`: pendiente por `Schema engine error` desde esta sesion.

## Ajuste formato CSV de personas

- Se agrego boton `Descargar formato` junto a `Subir CSV` en Administracion > Personas.
- El archivo descargado se llama `formato-personas-prestamo.csv`.
- Incluye las columnas:
  - `codigo`
  - `nombre`
  - `correo`
  - `carrera`
  - `semestre`
  - `rol`
- Incluye filas de ejemplo para estudiante, profesor y administrativo.

## Validaciones ajuste formato CSV

- `npm run lint --workspace @silab/frontend`: correcto.
- `npm run build --workspace @silab/frontend`: correcto.

## Ajuste desplegables buscables

- Se agrego componente reusable `SearchableSelect`.
- Todos los `<select>` nativos del frontend fueron reemplazados por desplegables con buscador interno.
- El buscador filtra mientras se escribe segun el contexto:
  - Equipos: codigo, nombre, codigo de barras y categoria.
  - Personas: codigo, nombre, correo y carrera.
  - Unidades: codigo y serial.
  - Ubicaciones/laboratorios: nombre, codigo, ruta y tipo.
  - Categorias, roles, facultades, programas y estados: nombre, codigo o descripcion disponible.
- Se mantuvo `LocationCombobox` para ubicaciones porque ya tenia buscador y muestra rutas padre/hijo.

## Validaciones ajuste desplegables buscables

- `npm run lint --workspace @silab/frontend`: correcto.
- `npm run build --workspace @silab/frontend`: correcto.

## Ajuste programas academicos y periodo de materias

- Se agrego CRUD backend para `Programas`:
  - `POST /programs`
  - `PATCH /programs/:id`
  - `DELETE /programs/:id`
- Los programas quedan amarrados a facultades mediante `facultadId`.
- No se permite eliminar programas con usuarios, materias, proyectos o actividades asociadas.
- Se agrego la pagina `Programas` en el menu Academico y ruta `/programs`.
- La pagina permite listar, buscar, crear, editar y eliminar programas.
- En materias, el campo libre `Periodo` para profesores/grupos se cambio por selector:
  - Diurno
  - Nocturno
  - Virtual

## Validaciones ajuste programas academicos

- `npm run lint --workspace @silab/backend`: correcto.
- `npm run build --workspace @silab/backend`: correcto.
- `npm run lint --workspace @silab/frontend`: correcto.
- `npm run build --workspace @silab/frontend`: correcto.

## Ajuste catalogo academico: materias, semilleros, proyectos y actividades

- Se amplio el modelo academico para soportar materias con varios profesores y grupos.
- Se agrego entidad `MateriaProfesor` con:
  - Materia.
  - Profesor.
  - Grupo.
  - Periodo.
  - Estado activo/inactivo.
- `Materia.semestre` quedo opcional para permitir materias transversales o casos donde el semestre aun no este definido.
- Se agrego entidad `Semillero` con:
  - Facultad.
  - Coordinador de semillero.
  - Codigo.
  - Nombre.
  - Descripcion.
  - Estado activo/inactivo.
- `Proyecto` ahora puede asociarse a un semillero.
- `Actividad` ahora puede asociarse a facultad, programa, responsable y semillero.
- `Prestamo` ahora puede guardar `materiaProfesorId` para saber no solo la materia, sino tambien el profesor y grupo relacionado con el uso del equipo.
- Se agrego migracion `backend/prisma/migrations/20260609165000_add_subject_professors_and_seedbeds/migration.sql`.
- Prisma genero ademas la migracion `backend/prisma/migrations/20260609224309_add_subject_professors_and_seedbeds/migration.sql`.
- Las migraciones quedaron aplicadas en PostgreSQL remoto `siilab_fci_dev`, schema `public`.
- Se amplio `AcademicModule` con CRUD real para:
  - Materias.
  - Semilleros.
  - Proyectos.
  - Actividades.
- Se agrego endpoint `GET /api/v1/academic-users` para seleccionar profesores, coordinadores y responsables desde usuarios reales.
- Se agregaron rutas backend:
  - `GET/POST /api/v1/subjects`
  - `PATCH/DELETE /api/v1/subjects/:id`
  - `GET/POST /api/v1/seedbeds`
  - `PATCH/DELETE /api/v1/seedbeds/:id`
  - `GET/POST /api/v1/projects`
  - `PATCH/DELETE /api/v1/projects/:id`
  - `GET/POST /api/v1/activities`
  - `PATCH/DELETE /api/v1/activities/:id`
- Se aplico alcance por facultad en consultas y escritura academica.
- Se agregaron validaciones para impedir asociar profesores, coordinadores, responsables, programas, proyectos o actividades fuera de la facultad visible del usuario.
- Se evita eliminar materias, proyectos o actividades con prestamos asociados.
- Se evita eliminar semilleros con proyectos o actividades asociados.
- Se amplio el flujo de prestamos para asociar materia, profesor/grupo, proyecto y actividad.
- Si el tipo de uso del prestamo es academico, el backend exige materia o profesor/grupo de materia.
- El formulario interno de prestamos ahora muestra el contexto academico y guarda esos datos reales.
- Se agregaron paginas frontend reales para:
  - `/subjects`
  - `/seedbeds`
  - `/projects`
  - `/activities`
- Las paginas permiten listar, buscar, crear, editar y eliminar segun permiso `academia:gestionar`.
- Se agrego la opcion `Semilleros` al menu Academico.

## Validaciones ajuste catalogo academico

- `npm.cmd run prisma:validate`: correcto.
- `npm.cmd run prisma:generate`: correcto.
- `npm.cmd run prisma:migrate:dev --workspace @silab/backend -- --name add_subject_professors_and_seedbeds`: correcto.
- `npx.cmd prisma migrate status --schema ../schema_silab_fci.prisma`: correcto, base al dia con 10 migraciones.
- `npm.cmd run build --workspace @silab/backend`: correcto.
- `npm.cmd run build --workspace @silab/frontend`: correcto, con advertencia de bundle mayor a 500 kB.
- `npm.cmd run lint --workspace @silab/backend`: correcto.
- `npm.cmd run lint --workspace @silab/frontend`: correcto.
- `npm.cmd run dev:backend`: compila con 0 errores y Nest inicia correctamente; la ejecucion se corto por timeout despues de confirmar el arranque.

## Ajuste solicitudes publicas, conversion a prestamo y acta de entrega

- Se ajusto el flujo de solicitudes publicas:
  - Al aprobar ya no queda solo como `CONVERTIDA`.
  - Ahora se abre un modal de aprobacion antes de convertir.
  - En el modal se pueden corregir fecha de prestamo, devolucion estimada, equipo real, unidad serializada, cantidad, tipo de uso y contexto academico.
  - Al confirmar, el backend crea un `Prestamo` real en estado `APROBADO`.
  - La solicitud publica queda enlazada con `prestamoConvertidoId`.
  - La lista de `Solicitudes recientes` se actualiza con el prestamo creado.
- Se agrego entidad `PrestamoEvidencia` para evidencias del acta de entrega.
- Se agrego enum `TipoEvidenciaPrestamo`:
  - `FOTO`
  - `FIRMA_COORDINADOR`
  - `FIRMA_SOLICITANTE`
- La entrega de un prestamo aprobado ahora exige:
  - Al menos una foto del equipo entregado.
  - Firma digital de coordinacion o usuario del sistema que entrega.
  - Firma digital del solicitante.
- El frontend permite capturar fotos con entrada de camara/galeria en celular usando `capture="environment"`.
- Se reutilizo el componente de firma digital sobre canvas para capturar firma con mouse, lapiz o dedo.
- Se agrego endpoint:
  - `GET /api/v1/loans/:id/delivery-act`
- Se agrego pagina frontend:
  - `/loans/:id/acta-entrega`
- La pagina de acta de entrega permite:
  - Ver datos del prestamo.
  - Ver equipos entregados.
  - Ver fotos capturadas.
  - Ver firmas digitales.
  - Imprimir desde navegador.
  - Descargar PDF desde el endpoint existente de acta de prestamo.
- El PDF de acta de prestamo ahora reconoce evidencias registradas y lista fotos/firmantes en la seccion de firmas.
- Se alineo el schema local con dos migraciones que ya estaban aplicadas en la base remota pero faltaban en el repositorio local:
  - `20260609194000_add_people_to_academic_responsibles`
  - `20260610102000_add_public_request_applicant_details`
- Se agrego y aplico la migracion:
  - `20260610103000_add_delivery_evidence_and_public_request_conversion`

## Validaciones ajuste acta de entrega

- `npm.cmd run prisma:validate`: correcto.
- `npm.cmd run prisma:format`: correcto.
- `npm.cmd run prisma:generate`: correcto.
- `npx.cmd prisma db execute --config D:\silab\backend\prisma.config.ts --stdin`: correcto, migracion SQL nueva aplicada sin resetear datos.
- `npx.cmd prisma migrate resolve --config D:\silab\backend\prisma.config.ts --applied 20260610103000_add_delivery_evidence_and_public_request_conversion`: correcto.
- `npx.cmd prisma migrate status --config D:\silab\backend\prisma.config.ts`: correcto, base al dia con 13 migraciones.
- `npm.cmd run build --workspace @silab/backend`: correcto.
- `npm.cmd run build --workspace @silab/frontend`: correcto, con advertencia de bundle mayor a 500 kB.
- `npm.cmd run lint --workspace @silab/backend`: correcto.
- `npm.cmd run lint --workspace @silab/frontend`: correcto.
- `npm.cmd run dev:backend`: compila con 0 errores y carga rutas nuevas; no tomo el puerto porque ya habia un backend activo en `:3000`.
- `GET http://localhost:3000/api/v1/health`: correcto.
- Navegador integrado en `http://localhost:5173/loans`: correcto, sin errores de consola.
