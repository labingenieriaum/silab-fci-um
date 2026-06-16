import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested
} from "class-validator";
import { EstadoCondicionEquipo, TipoEvidenciaDevolucion } from "@prisma/client";

export class RegisterReturnDetailDto {
  @Type(() => Number)
  @IsInt()
  prestamoDetalleId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  cantidad!: number;

  @IsEnum(EstadoCondicionEquipo)
  estadoDevolucion!: EstadoCondicionEquipo;

  @IsString()
  @IsOptional()
  observaciones?: string | null;
}

export class RegisterReturnEvidenceDto {
  @IsEnum(TipoEvidenciaDevolucion)
  tipo!: TipoEvidenciaDevolucion;

  @IsString()
  @IsOptional()
  @MaxLength(160)
  nombreArchivo?: string | null;

  @IsString()
  @MaxLength(80)
  mimeType!: string;

  @IsString()
  contenidoBase64!: string;

  @IsString()
  @IsOptional()
  @MaxLength(120)
  firmanteNombre?: string | null;
}

export class RegisterReturnDto {
  @IsString()
  @IsOptional()
  observaciones?: string | null;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RegisterReturnDetailDto)
  detalles!: RegisterReturnDetailDto[];

  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => RegisterReturnEvidenceDto)
  evidencias!: RegisterReturnEvidenceDto[];
}
