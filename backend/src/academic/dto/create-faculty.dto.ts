import { IsString, MinLength } from "class-validator";

export class CreateFacultyDto {
  @IsString()
  @MinLength(3)
  nombre!: string;

  @IsString()
  @MinLength(2)
  sigla!: string;
}
