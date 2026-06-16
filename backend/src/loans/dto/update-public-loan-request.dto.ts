import { Type } from "class-transformer";
import { EstadoSolicitudPublicaPrestamo, TipoUso } from "@prisma/client";
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min
} from "class-validator";

export class UpdatePublicLoanRequestDto {
  @IsEnum(EstadoSolicitudPublicaPrestamo)
  estado!: EstadoSolicitudPublicaPrestamo;

  @IsDateString()
  @IsOptional()
  fechaPrestamo?: string;

  @IsDateString()
  @IsOptional()
  fechaDevolucionEstimada?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  equipoId?: number | null;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  equipoUnidadId?: number | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  cantidadAprobada?: number;

  @IsEnum(TipoUso)
  @IsOptional()
  tipoUso?: TipoUso;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  materiaId?: number | null;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  materiaProfesorId?: number | null;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  proyectoId?: number | null;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  actividadId?: number | null;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  semilleroId?: number | null;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  observacionesInternas?: string | null;
}
