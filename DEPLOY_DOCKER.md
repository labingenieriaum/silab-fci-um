# Despliegue con Docker Compose

## Primera vez en el servidor

```bash
git pull
cp .env.example .env
nano .env
```

Configura `DATABASE_URL` con la base de produccion ya creada. Como PostgreSQL ya existe en otro contenedor, el host debe ser el nombre de ese contenedor: `siilab_postgres`.

```env
DATABASE_URL=postgresql://siilab_prod_user:PASSWORD_PRODUCCION@siilab_postgres:5432/siilab_fci_prod?schema=public
```

El contenedor existente de PostgreSQL debe estar conectado a la red `siilab_network`:

```bash
docker network create siilab_network
docker network connect siilab_network siilab_postgres
```

Levanta el stack:

```bash
docker compose up -d --build
```

Aplica migraciones de Prisma sobre la base de produccion:

```bash
docker compose exec backend npx prisma migrate deploy --schema ../schema_silab_fci.prisma
```

Revisa tambien [SECURITY_PRODUCTION.md](./SECURITY_PRODUCTION.md) antes de exponer el servicio a Internet.

## Actualizar despues de cambios

```bash
git pull
docker compose up -d --build
docker compose exec backend npx prisma migrate deploy --schema ../schema_silab_fci.prisma
```

## Ver logs

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

## Importante

Este Compose no crea ni borra PostgreSQL. Usa el contenedor existente `siilab_postgres`.
