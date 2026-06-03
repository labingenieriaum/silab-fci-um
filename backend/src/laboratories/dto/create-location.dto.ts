import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MinLength } from "class-validator";
import { TipoUbicacion } from "@prisma/client";

export class CreateLocationDto {
  @Type(() => Number)
  @IsInt()
  laboratorioId!: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  ubicacionPadreId?: number | null;

  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsEnum(TipoUbicacion)
  tipo!: TipoUbicacion;

  @IsString()
  @IsOptional()
  descripcion?: string | null;

  @IsBoolean()
  @IsOptional()
  activa?: boolean;
}
