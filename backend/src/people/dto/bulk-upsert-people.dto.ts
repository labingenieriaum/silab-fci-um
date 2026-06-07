import { ArrayMinSize, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { CreatePersonDto } from "./create-person.dto";

export class BulkUpsertPeopleDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePersonDto)
  personas!: CreatePersonDto[];
}
