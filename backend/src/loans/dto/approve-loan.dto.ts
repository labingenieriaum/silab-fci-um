import { Type } from "class-transformer";
import { IsArray, IsInt, IsOptional, Min, ValidateNested } from "class-validator";

export class ApproveLoanDetailDto {
  @Type(() => Number)
  @IsInt()
  prestamoDetalleId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  cantidadAprobada!: number;
}

export class ApproveLoanDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApproveLoanDetailDto)
  @IsOptional()
  detalles?: ApproveLoanDetailDto[];
}
