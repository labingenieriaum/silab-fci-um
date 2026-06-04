import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested
} from "class-validator";
import { EstadoCondicionEquipo } from "@prisma/client";

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

export class RegisterReturnDto {
  @IsString()
  @IsOptional()
  observaciones?: string | null;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RegisterReturnDetailDto)
  detalles!: RegisterReturnDetailDto[];
}
