import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested
} from "class-validator";
import { RolPersonaPrestamo, TipoUso } from "@prisma/client";

export class CreateLoanDetailDto {
  @Type(() => Number)
  @IsInt()
  equipoId!: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  equipoUnidadId?: number | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  cantidadSolicitada = 1;

  @IsString()
  @IsOptional()
  observaciones?: string | null;
}

export class CreateLoanDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  personaSolicitanteId?: number;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  @IsOptional()
  personaCodigo?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(160)
  @IsOptional()
  personaNombre?: string;

  @IsEmail()
  @MaxLength(160)
  @IsOptional()
  personaCorreoInstitucional?: string;

  @IsString()
  @MaxLength(160)
  @IsOptional()
  personaCarrera?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  personaSemestre?: number | null;

  @IsEnum(RolPersonaPrestamo)
  @IsOptional()
  personaRol?: RolPersonaPrestamo;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  usuarioSolicitanteId?: number;

  @IsString()
  @MinLength(3)
  @MaxLength(120)
  @IsOptional()
  solicitanteNombre?: string;

  @IsEmail()
  @MaxLength(160)
  @IsOptional()
  solicitanteCorreo?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(40)
  @IsOptional()
  solicitanteDocumento?: string;

  @IsEnum(TipoUso)
  tipoUso!: TipoUso;

  @IsDateString()
  fechaRequerida!: string;

  @IsDateString()
  fechaDevolucionEstimada!: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  materiaId?: number | null;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  proyectoId?: number | null;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  actividadId?: number | null;

  @IsString()
  @IsOptional()
  observaciones?: string | null;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateLoanDetailDto)
  detalles!: CreateLoanDetailDto[];
}
