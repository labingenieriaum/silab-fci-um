import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { EstadoEquipo } from "@prisma/client";

export class ListEquipmentQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

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
  responsableId?: number;

  @IsEnum(EstadoEquipo)
  @IsOptional()
  estado?: EstadoEquipo;

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
  pageSize = 25;
}
