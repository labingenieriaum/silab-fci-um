import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateSeedbedDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  facultadId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  coordinadorId?: number;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  @IsOptional()
  codigo?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(160)
  @IsOptional()
  nombre?: string;

  @IsString()
  @MaxLength(800)
  @IsOptional()
  descripcion?: string | null;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
