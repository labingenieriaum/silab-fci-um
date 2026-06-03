import { IsOptional, IsString, MinLength } from "class-validator";

export class UpdateEquipmentCategoryDto {
  @IsString()
  @MinLength(2)
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  descripcion?: string | null;
}
