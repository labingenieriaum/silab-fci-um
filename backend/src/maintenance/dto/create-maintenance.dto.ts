import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString } from "class-validator";
import { TipoMantenimiento } from "@prisma/client";

export class CreateMaintenanceDto {
  @Type(() => Number)
  @IsInt()
  equipoId!: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  equipoUnidadId?: number;

  @IsEnum(TipoMantenimiento)
  tipoMantenimiento!: TipoMantenimiento;

  @IsString()
  descripcion!: string;

  @IsString()
  @IsOptional()
  observaciones?: string | null;
}
