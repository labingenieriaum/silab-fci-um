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
import { SubjectProfessorInputDto } from "./create-subject.dto";

export class UpdateSubjectDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  programaId?: number;

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
