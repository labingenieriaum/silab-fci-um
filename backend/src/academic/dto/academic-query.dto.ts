import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class AcademicListQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  facultadId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  programaId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  semilleroId?: number;

  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  activo?: boolean;

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
