import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { TipoProyecto } from "@prisma/client";

export class UpdateProjectDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  programaId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  responsableId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  semilleroId?: number | null;

  @IsString()
  @MinLength(3)
  @MaxLength(180)
  @IsOptional()
  nombre?: string;

  @IsEnum(TipoProyecto)
  @IsOptional()
  tipo?: TipoProyecto;

  @IsString()
  @MaxLength(180)
  @IsOptional()
  semilleroInvestigacion?: string | null;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  descripcion?: string | null;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
