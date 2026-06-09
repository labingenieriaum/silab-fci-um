import { IsEnum, IsOptional, IsString } from "class-validator";
import { EstadoCondicionEquipo } from "@prisma/client";

export class CloseMaintenanceDto {
  @IsEnum(EstadoCondicionEquipo)
  estadoSalida!: EstadoCondicionEquipo;

  @IsString()
  @IsOptional()
  observaciones?: string | null;
}
