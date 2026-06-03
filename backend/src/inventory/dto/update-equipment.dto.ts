import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength
} from "class-validator";
import { EstadoEquipo } from "@prisma/client";

export class UpdateEquipmentDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  categoriaId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  ubicacionId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  responsableId?: number | null;

  @IsString()
  @MinLength(2)
  @IsOptional()
  codigoInterno?: string;

  @IsString()
  @MinLength(2)
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  marca?: string | null;

  @IsString()
  @IsOptional()
  modelo?: string | null;

  @IsBoolean()
  @IsOptional()
  requiereSerial?: boolean;

  @IsEnum(EstadoEquipo)
  @IsOptional()
  estado?: EstadoEquipo;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  valorEstimado?: number;

  @IsString()
  @IsOptional()
  observaciones?: string | null;
}
