import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested
} from "class-validator";

export class SubjectProfessorInputDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  profesorId?: number | null;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  profesorPersonaId?: number | null;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  @IsOptional()
  grupo?: string;

  @IsString()
  @MaxLength(40)
  @IsOptional()
  periodo?: string | null;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

export class CreateSubjectDto {
  @Type(() => Number)
  @IsInt()
  programaId!: number;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  codigo!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(160)
  nombre!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  semestre?: number | null;

  @IsBoolean()
  @IsOptional()
  activa?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubjectProfessorInputDto)
  @IsOptional()
  profesores?: SubjectProfessorInputDto[];
}
