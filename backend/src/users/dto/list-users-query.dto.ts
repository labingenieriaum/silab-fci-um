import { Type } from "class-transformer";
import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class ListUsersQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  rolId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  programaId?: number;

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
  pageSize = 20;
}

