import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength
} from "class-validator";
import { RolPersonaPrestamo } from "@prisma/client";

export class CreatePersonDto {
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  codigo!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(160)
  nombre!: string;

  @IsEmail()
  @MaxLength(160)
  @IsOptional()
  correoInstitucional?: string | null;

  @IsString()
  @MaxLength(160)
  @IsOptional()
  carrera?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  semestre?: number | null;

  @IsEnum(RolPersonaPrestamo)
  rol!: RolPersonaPrestamo;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
