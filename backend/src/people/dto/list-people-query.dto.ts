import { Transform, Type } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { RolPersonaPrestamo } from "@prisma/client";

export class ListPeopleQueryDto {
  @IsString()
  @IsOptional()
  search?: string;

  @IsEnum(RolPersonaPrestamo)
  @IsOptional()
  rol?: RolPersonaPrestamo;

  @IsString()
  @IsOptional()
  carrera?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  @IsOptional()
  semestre?: number;

  @Transform(({ value }) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  })
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
  @Max(200)
  @IsOptional()
  pageSize = 50;
}
