import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class UpdateProgramDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  facultadId?: number;

  @IsString()
  @MinLength(3)
  @MaxLength(160)
  @IsOptional()
  nombre?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  @IsOptional()
  codigo?: string;
}
