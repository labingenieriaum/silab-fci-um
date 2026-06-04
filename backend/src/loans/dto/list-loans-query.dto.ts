import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { EstadoPrestamo } from "@prisma/client";

export class ListLoansQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(EstadoPrestamo)
  @IsOptional()
  estado?: EstadoPrestamo;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  usuarioSolicitanteId?: number;

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
