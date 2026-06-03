import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, MinLength } from "class-validator";
import { EstadoEquipo } from "@prisma/client";

export class UpdateEquipmentUnitDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  codigoInterno?: string;

  @IsString()
  @IsOptional()
  serial?: string | null;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  ubicacionId?: number | null;

  @IsEnum(EstadoEquipo)
  @IsOptional()
  estado?: EstadoEquipo;

  @IsString()
  @IsOptional()
  observaciones?: string | null;
}
