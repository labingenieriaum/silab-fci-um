import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { TipoMovimiento } from "@prisma/client";

export class ListInventoryMovementsQueryDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  equipoId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  equipoUnidadId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  usuarioId?: number;

  @IsEnum(TipoMovimiento)
  @IsOptional()
  tipoMovimiento?: TipoMovimiento;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @IsOptional()
  pageSize = 50;
}

export class RegisterInventoryEntryDto {
  @Type(() => Number)
  @IsInt()
  equipoId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  cantidad!: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  ubicacionDestinoId?: number;

  @IsString()
  @IsOptional()
  descripcion?: string | null;
}

export class RegisterInventoryAdjustmentDto {
  @Type(() => Number)
  @IsInt()
  equipoId!: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  equipoUnidadId?: number;

  @IsEnum(TipoMovimiento)
  tipoMovimiento!: TipoMovimiento;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  cantidad!: number;

  @IsString()
  @IsOptional()
  descripcion?: string | null;
}

export class RegisterInventoryTransferDto {
  @Type(() => Number)
  @IsInt()
  equipoId!: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  equipoUnidadId?: number;

  @Type(() => Number)
  @IsInt()
  ubicacionDestinoId!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  cantidad = 1;

  @IsString()
  @IsOptional()
  descripcion?: string | null;
}
