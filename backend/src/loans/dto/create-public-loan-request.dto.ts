import { Type } from "class-transformer";
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Matches,
  MaxLength,
  Min,
  MinLength
} from "class-validator";
import { RolPersonaPrestamo } from "@prisma/client";

export class CreatePublicLoanRequestDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nombreCompleto!: string;

  @IsEmail()
  @MaxLength(160)
  @Matches(/@umanizales\.edu\.co$/i, {
    message: "El correo debe ser institucional de la Universidad de Manizales."
  })
  correoInstitucional!: string;

  @IsEnum(RolPersonaPrestamo)
  rolSolicitante!: RolPersonaPrestamo;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  identificacion!: string;

  @IsString()
  @MaxLength(160)
  @IsOptional()
  programa?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  semestre?: number | null;

  @IsString()
  @MaxLength(180)
  @IsOptional()
  materia?: string | null;

  @IsString()
  @MaxLength(180)
  @IsOptional()
  dependencia?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  equipoId?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(999)
  @IsOptional()
  cantidadSolicitada?: number;

  @IsString()
  @MinLength(2)
  @MaxLength(180)
  codigo!: string;

  @IsDateString()
  fechaPrestamo!: string;

  @IsDateString()
  fechaDevolucionEstimada!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1200)
  descripcionActividad!: string;
}
