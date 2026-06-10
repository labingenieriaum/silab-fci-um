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
import { EstadoCondicionEquipo, TipoEvidenciaPrestamo } from "@prisma/client";

export class DeliverLoanDetailDto {
  @Type(() => Number)
  @IsInt()
  prestamoDetalleId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  cantidadEntregada?: number;

  @IsEnum(EstadoCondicionEquipo)
  @IsOptional()
  estadoEntrega?: EstadoCondicionEquipo;
}

export class DeliverLoanEvidenceDto {
  @IsEnum(TipoEvidenciaPrestamo)
  tipo!: TipoEvidenciaPrestamo;

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

export class DeliverLoanDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliverLoanDetailDto)
  @IsOptional()
  detalles?: DeliverLoanDetailDto[];

  @IsArray()
  @ArrayMinSize(3)
  @ValidateNested({ each: true })
  @Type(() => DeliverLoanEvidenceDto)
  evidencias!: DeliverLoanEvidenceDto[];
}
