import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min
} from "class-validator";

export class ListAgreementsQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  pageSize = 100;

  @IsString()
  @IsOptional()
  search?: string;

  @IsBoolean()
  @Transform(({ value }) => value === true || value === "true")
  @IsOptional()
  activo?: boolean;
}

export class UpsertAgreementDto {
  @IsString()
  @MaxLength(180)
  nombre!: string;

  @IsString()
  @MaxLength(60)
  @IsOptional()
  identificacion?: string | null;

  @IsString()
  @MaxLength(160)
  @IsOptional()
  correo?: string | null;

  @IsString()
  @MaxLength(60)
  @IsOptional()
  telefono?: string | null;

  @IsString()
  @MaxLength(180)
  @IsOptional()
  contacto?: string | null;

  @IsString()
  @IsOptional()
  observaciones?: string | null;

  @IsString()
  @MaxLength(220)
  @IsOptional()
  documentoNombre?: string | null;

  @IsString()
  @MaxLength(120)
  @IsOptional()
  documentoMimeType?: string | null;

  @IsString()
  @IsOptional()
  documentoBase64?: string | null;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}
