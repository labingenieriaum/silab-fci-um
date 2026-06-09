import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { TipoActividad } from "@prisma/client";

export class UpdateActivityDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  facultadId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  programaId?: number | null;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  responsableId?: number | null;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  semilleroId?: number | null;

  @IsString()
  @MinLength(3)
  @MaxLength(180)
  @IsOptional()
  nombre?: string;

  @IsEnum(TipoActividad)
  @IsOptional()
  tipo?: TipoActividad;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  descripcion?: string | null;

  @IsBoolean()
  @IsOptional()
  activa?: boolean;
}
