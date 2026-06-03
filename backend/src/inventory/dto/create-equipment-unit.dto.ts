import { Type } from "class-transformer";
import { IsInt, IsOptional, IsString, MinLength } from "class-validator";

export class CreateEquipmentUnitDto {
  @IsString()
  @MinLength(2)
  codigoInterno!: string;

  @IsString()
  @IsOptional()
  serial?: string | null;

  @Type(() => Number)
  @IsInt()
  @IsOptional()
  ubicacionId?: number | null;

  @IsString()
  @IsOptional()
  observaciones?: string | null;
}
