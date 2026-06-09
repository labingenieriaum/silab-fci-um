import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query
} from "@nestjs/common";
import { Permissions } from "../common/decorators/permissions.decorator";
import { BulkUpsertPeopleDto } from "./dto/bulk-upsert-people.dto";
import { CreatePersonDto } from "./dto/create-person.dto";
import { ListPeopleQueryDto } from "./dto/list-people-query.dto";
import { UpdatePersonDto } from "./dto/update-person.dto";
import { PeopleService } from "./people.service";

@Controller("people")
@Permissions("usuarios:gestionar")
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Get()
  findAll(@Query() query: ListPeopleQueryDto) {
    return this.peopleService.findAll(query);
  }

  @Post()
  create(@Body() dto: CreatePersonDto) {
    return this.peopleService.create(dto);
  }

  @Post("bulk")
  bulkUpsert(@Body() dto: BulkUpsertPeopleDto) {
    return this.peopleService.bulkUpsert(dto);
  }

  @Get(":id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.peopleService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpdatePersonDto) {
    return this.peopleService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.peopleService.remove(id);
  }
}
