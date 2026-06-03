import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, MinLength } from "class-validator";

export class CreateLaboratoryDto {
  @Type(() => Number)
  @IsInt()
  facultadId!: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  responsableId?: number | null;

  @IsString()
  @MinLength(3)
  nombre!: string;

  @IsString()
  @MinLength(2)
  codigo!: string;

  @IsString()
  @IsOptional()
  descripcion?: string | null;
}
