import { Type } from "class-transformer";
import { IsArray, ValidateNested } from "class-validator";
import { CreateEquipmentDto } from "./create-equipment.dto";

export class BulkEquipmentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateEquipmentDto)
  rows!: CreateEquipmentDto[];
}
