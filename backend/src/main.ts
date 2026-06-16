import "reflect-metadata";
import * as compression from "compression";
import * as cookieParser from "cookie-parser";
import type { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.set("trust proxy", 1);

  app.setGlobalPrefix("api");
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1"
  });

  const allowedOrigins = parseAllowedOrigins(process.env.CORS_ORIGIN);
  app.enableCors({
    origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed by CORS."));
    },
    credentials: true
  });

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          frameAncestors: ["'none'"],
          formAction: ["'self'"],
          objectSrc: ["'none'"]
        }
      },
      crossOriginEmbedderPolicy: false,
      hsts:
        process.env.NODE_ENV === "production"
          ? {
              maxAge: 15552000,
              includeSubDomains: true
            }
          : false,
      referrerPolicy: {
        policy: "no-referrer"
      }
    })
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(createRateLimitMiddleware());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  );

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

void bootstrap();

function parseAllowedOrigins(corsOrigin?: string) {
  const origins = (corsOrigin ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (process.env.NODE_ENV === "production" && origins.length === 0) {
    throw new Error("CORS_ORIGIN is required in production.");
  }

  return new Set(origins.length ? origins : ["http://localhost:5173"]);
}

function createRateLimitMiddleware() {
  const buckets = new Map<string, RateLimitBucket>();
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000);
  const defaultMax = Number(process.env.RATE_LIMIT_MAX ?? 120);
  const authMax = Number(process.env.AUTH_RATE_LIMIT_MAX ?? 10);

  return (request: Request, response: Response, next: NextFunction) => {
    const now = Date.now();
    const max = isAuthEndpoint(request) ? authMax : defaultMax;
    const key = `${request.ip}:${isAuthEndpoint(request) ? "auth" : "api"}`;
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, {
        count: 1,
        resetAt: now + windowMs
      });
      next();
      return;
    }

    bucket.count += 1;
    const retryAfterSeconds = Math.ceil((bucket.resetAt - now) / 1000);
    response.setHeader("RateLimit-Limit", String(max));
    response.setHeader("RateLimit-Remaining", String(Math.max(max - bucket.count, 0)));
    response.setHeader("RateLimit-Reset", String(retryAfterSeconds));

    if (bucket.count > max) {
      response.setHeader("Retry-After", String(retryAfterSeconds));
      response.status(429).json({
        statusCode: 429,
        message: "Too many requests. Try again later."
      });
      return;
    }

    next();
  };
}

function isAuthEndpoint(request: Request) {
  return request.path === "/api/v1/auth/login" || request.path === "/api/v1/auth/refresh";
}
