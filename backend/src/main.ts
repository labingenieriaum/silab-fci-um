import "reflect-metadata";
import * as compression from "compression";
import * as cookieParser from "cookie-parser";
import helmet from "helmet";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix("api");
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1"
  });

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:5173"],
    credentials: true
  });

  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());
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
