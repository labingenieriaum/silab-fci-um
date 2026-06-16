FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

RUN npm ci

COPY schema_silab_fci.prisma ./schema_silab_fci.prisma
COPY backend ./backend

# Prisma 7 loads prisma.config.ts during generate and requires a valid
# DATABASE_URL even though it does not connect to the database here.
ENV DATABASE_URL=postgresql://prisma:prisma@localhost:5432/prisma?schema=public

RUN npm run prisma:generate --workspace @silab/backend
RUN npm run build --workspace @silab/backend

FROM node:22-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/schema_silab_fci.prisma ./schema_silab_fci.prisma
COPY --from=build /app/backend/package*.json ./backend/
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/prisma ./backend/prisma
COPY --from=build /app/backend/src/prisma ./backend/src/prisma
COPY --from=build /app/backend/prisma.config.ts ./backend/prisma.config.ts

WORKDIR /app/backend

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
