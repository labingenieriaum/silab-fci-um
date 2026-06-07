import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { EstadoMantenimiento } from "@prisma/client";

export class ListMaintenanceQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(EstadoMantenimiento)
  @IsOptional()
  estado?: EstadoMantenimiento;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  equipoId?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize = 25;
}
