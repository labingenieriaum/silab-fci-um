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

export class CreateUserDto {
  @Type(() => Number)
  @IsInt()
  rolId!: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  facultadId?: number;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  programaId?: number;

  @IsString()
  @MinLength(3)
  nombre!: string;

  @IsEmail()
  correo!: string;

  @IsString()
  @MinLength(5)
  documento!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(TipoUsuario)
  tipoUsuario!: TipoUsuario;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;
}

