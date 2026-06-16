# Seguridad de produccion

## CORS

`CORS_ORIGIN` debe contener solo el origen real de la aplicacion:

```env
CORS_ORIGIN=https://tudominio.com
```

Si usas IP durante pruebas:

```env
CORS_ORIGIN=http://10.60.15.10
```

No uses `*` porque la API usa credenciales.

## PostgreSQL y RLS

El backend se conecta con Prisma usando un usuario de base de datos. Para produccion, lo mas seguro es separar usuarios:

- Usuario migrador: puede crear/alterar tablas y ejecutar `prisma migrate deploy`.
- Usuario de aplicacion: solo puede leer/escribir las tablas necesarias.

RLS no debe activarse a ciegas sobre todas las tablas porque Prisma no esta enviando aun variables de sesion por usuario en cada consulta. El flujo correcto para RLS es:

1. Definir el criterio de aislamiento: por facultad, programa, rol o usuario.
2. Crear politicas por tabla.
3. Hacer que cada transaccion del backend ejecute `SET LOCAL app.user_id`, `SET LOCAL app.facultad_id` y/o `SET LOCAL app.role`.
4. Probar todas las rutas antes de forzar RLS.
5. Activar `FORCE ROW LEVEL SECURITY` solo cuando las politicas esten completas.

Ejemplo base para una tabla con `facultad_id`:

```sql
ALTER TABLE laboratorios ENABLE ROW LEVEL SECURITY;

CREATE POLICY laboratorios_facultad_select
ON laboratorios
FOR SELECT
USING (
  current_setting('app.role', true) = 'admin'
  OR facultad_id::text = current_setting('app.facultad_id', true)
);
```

Si activas RLS sin adaptar Prisma para establecer esas variables, la aplicacion puede quedar sin acceso a datos.

## Cookies y tokens

El refresh token viaja en cookie `HttpOnly`, `Secure` en produccion y `SameSite=strict` por defecto.

El access token sigue en memoria/localStorage del frontend. Esto funciona, pero el riesgo principal es XSS. Por eso se agregaron headers CSP y se debe evitar cualquier `dangerouslySetInnerHTML`.

## Headers

El backend usa Helmet y el frontend Nginx agrega:

- `Content-Security-Policy`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `Referrer-Policy`
- `Permissions-Policy`

Cuando tengas HTTPS permanente, agrega HSTS tambien en el proxy TLS publico.

## Red Docker

El contenedor `siilab_postgres` debe estar en `siilab_network`:

```bash
docker network create siilab_network
docker network connect siilab_network siilab_postgres
```

No expongas PostgreSQL a Internet. Si no necesitas acceso externo a la base, elimina el mapeo publico `5432:5432` del contenedor de PostgreSQL en su compose original.
