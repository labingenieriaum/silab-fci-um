import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength
} from "class-validator";
import { EstadoEquipo, OrigenEquipo } from "@prisma/client";

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

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  convenioId?: number | null;

  @IsString()
  @MinLength(2)
  @IsOptional()
  codigoInterno?: string;

  @IsString()
  @IsOptional()
  codigoBarras?: string | null;

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
  @MaxLength(60)
  @IsOptional()
  convenioIdentificacion?: string | null;

  @IsString()
  @MaxLength(160)
  @IsOptional()
  convenioCorreo?: string | null;

  @IsString()
  @MaxLength(60)
  @IsOptional()
  convenioTelefono?: string | null;

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
