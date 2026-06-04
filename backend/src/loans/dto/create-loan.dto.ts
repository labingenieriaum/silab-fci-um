import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested
} from "class-validator";
import { TipoUso } from "@prisma/client";

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
  @IsEnum(TipoUso)
  tipoUso!: TipoUso;

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
