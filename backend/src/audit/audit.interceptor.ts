import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from "@nestjs/common";
import { Observable, tap } from "rxjs";
import type { Request } from "express";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import type { AuthenticatedRequest } from "../common/types/authenticated-request";

const ignoredPaths = ["/api/v1/auth/refresh", "/api/v1/auth/me", "/api/v1/dashboard"];

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest & Request>();
    if (request.method === "GET" || ignoredPaths.some((path) => request.originalUrl?.startsWith(path))) {
      return next.handle();
    }

    const startedAt = new Date();
    return next.handle().pipe(
      tap((response) => {
        void this.prisma.auditoria.create({
          data: {
            usuarioId: request.user?.sub,
            accion: request.method,
            modulo: moduleFromPath(request.path),
            tablaAfectada: tableFromPath(request.path),
            registroId: recordIdFromParams(request.params),
            datosAnteriores: undefined,
            datosNuevos: sanitize({ body: request.body, response }) as Prisma.InputJsonValue,
            ip: request.ip,
            userAgent: request.headers["user-agent"],
            fecha: startedAt
          }
        }).catch(() => undefined);
      })
    );
  }
}

function moduleFromPath(path = "") {
  return path.split("/").filter(Boolean)[0] ?? "sistema";
}

function tableFromPath(path = "") {
  return moduleFromPath(path).replace(/-/g, "_");
}

function recordIdFromParams(params: Record<string, string | string[]> = {}) {
  const rawValue = params.id;
  const value = Array.isArray(rawValue) ? rawValue[0] : rawValue;
  const parsed = value ? Number(value) : NaN;
  return Number.isInteger(parsed) ? parsed : undefined;
}

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item));
  }
  if (!value || typeof value !== "object") {
    return value;
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      /password|contrasena|token|contenidoBase64/i.test(key) ? "[oculto]" : sanitize(item)
    ])
  );
}
