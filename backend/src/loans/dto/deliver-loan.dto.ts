import { Type } from "class-transformer";
import { IsArray, IsEnum, IsInt, IsOptional, Min, ValidateNested } from "class-validator";
import { EstadoCondicionEquipo } from "@prisma/client";

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

export class DeliverLoanDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliverLoanDetailDto)
  @IsOptional()
  detalles?: DeliverLoanDetailDto[];
}
