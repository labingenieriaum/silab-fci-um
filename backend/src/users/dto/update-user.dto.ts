import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MinLength
} from "class-validator";
import { TipoUsuario } from "@prisma/client";

export class UpdateUserDto {
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  rolId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  facultadId?: number | null;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  programaId?: number | null;

  @IsString()
  @MinLength(3)
  @IsOptional()
  nombre?: string;

  @IsEmail()
  @IsOptional()
  correo?: string;

  @IsString()
  @MinLength(5)
  @IsOptional()
  documento?: string;

  @IsString()
  @MinLength(8)
  @IsOptional()
  password?: string;

  @IsEnum(TipoUsuario)
  @IsOptional()
  tipoUsuario?: TipoUsuario;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

