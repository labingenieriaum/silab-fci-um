import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateSeedbedDto {
  @Type(() => Number)
  @IsInt()
  facultadId!: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  coordinadorId?: number | null;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  coordinadorPersonaId?: number | null;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  codigo!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(160)
  nombre!: string;

  @IsString()
  @MaxLength(800)
  @IsOptional()
  descripcion?: string | null;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
