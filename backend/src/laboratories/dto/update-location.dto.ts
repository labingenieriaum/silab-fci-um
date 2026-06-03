import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MinLength } from "class-validator";
import { TipoUbicacion } from "@prisma/client";

export class UpdateLocationDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  laboratorioId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  ubicacionPadreId?: number | null;

  @IsString()
  @MinLength(2)
  @IsOptional()
  nombre?: string;

  @IsEnum(TipoUbicacion)
  @IsOptional()
  tipo?: TipoUbicacion;

  @IsString()
  @IsOptional()
  descripcion?: string | null;

  @IsBoolean()
  @IsOptional()
  activa?: boolean;
}
