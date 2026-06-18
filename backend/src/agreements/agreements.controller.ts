import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { Permissions } from "../common/decorators/permissions.decorator";
import { AgreementsService } from "./agreements.service";
import { ListAgreementsQueryDto, UpsertAgreementDto } from "./dto/agreement.dto";

@Controller("agreements")
@Permissions("inventario:gestionar")
export class AgreementsController {
  constructor(private readonly agreementsService: AgreementsService) {}

  @Get()
  findAll(@Query() query: ListAgreementsQueryDto) {
    return this.agreementsService.findAll(query);
  }

  @Post()
  create(@Body() dto: UpsertAgreementDto) {
    return this.agreementsService.create(dto);
  }

  @Patch(":id")
  update(@Param("id", ParseIntPipe) id: number, @Body() dto: UpsertAgreementDto) {
    return this.agreementsService.update(id, dto);
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.agreementsService.remove(id);
  }
}
