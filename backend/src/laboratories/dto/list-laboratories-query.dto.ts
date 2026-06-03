import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class ListLaboratoriesQueryDto {
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
  responsableId?: number;

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
