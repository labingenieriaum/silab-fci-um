import { Type } from "class-transformer";
import {
  IsDateString,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength
} from "class-validator";

export class CreatePublicLoanRequestDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nombreCompleto!: string;

  @IsEmail()
  @MaxLength(160)
  @Matches(/@umanizales\.edu\.co$/i, {
    message: "El correo debe ser institucional de la Universidad de Manizales."
  })
  correoInstitucional!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  equipoId?: number;

  @IsString()
  @MinLength(2)
  @MaxLength(180)
  codigo!: string;

  @IsDateString()
  fechaPrestamo!: string;

  @IsDateString()
  fechaDevolucionEstimada!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(1200)
  descripcionActividad!: string;
}
