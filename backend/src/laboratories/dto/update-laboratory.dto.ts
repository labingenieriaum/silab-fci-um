import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, MinLength } from "class-validator";

export class UpdateLaboratoryDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  facultadId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  responsableId?: number | null;

  @IsString()
  @MinLength(3)
  @IsOptional()
  nombre?: string;

  @IsString()
  @MinLength(2)
  @IsOptional()
  codigo?: string;

  @IsString()
  @IsOptional()
  descripcion?: string | null;
}
