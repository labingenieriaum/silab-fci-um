# SILAB FCI

Sistema de Inventario y Laboratorios de la Facultad de Ciencias e Ingenieria.

## Estructura

```txt
silab/
  backend/                 API NestJS, Prisma y PostgreSQL
  frontend/                React, Vite, TypeScript, TailwindCSS y Shadcn UI
  schema_silab_fci.prisma  Modelo Prisma principal
  codex.md                 Bitacora tecnica del proyecto
```

## Fase 1

La fase 1 deja lista la base del proyecto:

- Workspace npm con `backend` y `frontend`.
- Backend NestJS con modulo de salud, configuracion de entorno y PrismaService.
- Frontend Vite/React con layout inicial, TailwindCSS, Shadcn UI base, TanStack Query y rutas.
- Prisma configurado para usar `schema_silab_fci.prisma` en la raiz del proyecto.

## Comandos previstos

```bash
npm install
npm run prisma:validate
npm run prisma:generate
npm run dev:backend
npm run dev:frontend
```

## Variables de entorno

Revisar:

- `backend/.env.example`
- `frontend/.env.example`

