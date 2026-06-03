import { IsOptional, IsString, MinLength } from "class-validator";

export class UpdateFacultyDto {
  @IsString()
  @MinLength(3)
  @IsOptional()
  nombre?: string;

  @IsString()
  @MinLength(2)
  @IsOptional()
  sigla?: string;
}
