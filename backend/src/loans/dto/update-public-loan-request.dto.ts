import { EstadoSolicitudPublicaPrestamo } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdatePublicLoanRequestDto {
  @IsEnum(EstadoSolicitudPublicaPrestamo)
  estado!: EstadoSolicitudPublicaPrestamo;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  observacionesInternas?: string | null;
}
