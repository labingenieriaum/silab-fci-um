import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { TipoUbicacion } from "@prisma/client";

export class ListLocationsQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  laboratorioId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  ubicacionPadreId?: number;

  @IsEnum(TipoUbicacion)
  @IsOptional()
  tipo?: TipoUbicacion;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  activa?: boolean;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  @IsOptional()
  pageSize = 100;
}
