import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
  ValidateNested
} from "class-validator";
import { OrigenEquipo } from "@prisma/client";

export class EquipmentUnitInputDto {
  @IsString()
  @MinLength(2)
  codigoInterno!: string;

  @IsString()
  @IsOptional()
  serial?: string | null;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  ubicacionId?: number | null;

  @IsString()
  @IsOptional()
  observaciones?: string | null;
}

export class CreateEquipmentDto {
  @Type(() => Number)
  @IsInt()
  categoriaId!: number;

  @Type(() => Number)
  @IsInt()
  ubicacionId!: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  responsableId?: number | null;

  @IsString()
  @MinLength(2)
  codigoInterno!: string;

  @IsString()
  @IsOptional()
  codigoBarras?: string | null;

  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsString()
  @IsOptional()
  marca?: string | null;

  @IsString()
  @IsOptional()
  modelo?: string | null;

  @IsBoolean()
  @IsOptional()
  requiereSerial?: boolean;

  @IsBoolean()
  @IsOptional()
  permitePrestamo?: boolean;

  @IsEnum(OrigenEquipo)
  @IsOptional()
  origen?: OrigenEquipo;

  @IsString()
  @MaxLength(180)
  @IsOptional()
  convenioEntidad?: string | null;

  @IsString()
  @MaxLength(180)
  @IsOptional()
  convenioResponsable?: string | null;

  @IsString()
  @MaxLength(220)
  @IsOptional()
  convenioDocumentoNombre?: string | null;

  @IsString()
  @MaxLength(120)
  @IsOptional()
  convenioDocumentoMimeType?: string | null;

  @IsString()
  @IsOptional()
  convenioDocumentoBase64?: string | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  cantidadTotal?: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  valorEstimado?: number;

  @IsString()
  @IsOptional()
  observaciones?: string | null;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EquipmentUnitInputDto)
  @IsOptional()
  unidades?: EquipmentUnitInputDto[];
}
