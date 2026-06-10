import { Type } from "class-transformer";
import { IsInt, IsString, MaxLength, MinLength } from "class-validator";

export class CreateProgramDto {
  @Type(() => Number)
  @IsInt()
  facultadId!: number;

  @IsString()
  @MinLength(3)
  @MaxLength(160)
  nombre!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  codigo!: string;
}
