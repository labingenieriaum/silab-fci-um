import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Permissions } from "../common/decorators/permissions.decorator";
import type { JwtUser } from "../common/types/jwt-user";
import { CloseMaintenanceDto } from "./dto/close-maintenance.dto";
import { CreateMaintenanceDto } from "./dto/create-maintenance.dto";
import { ListMaintenanceQueryDto } from "./dto/list-maintenance-query.dto";
import { MaintenanceService } from "./maintenance.service";

@Controller("maintenance")
@Permissions("mantenimiento:gestionar")
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get()
  findAll(@CurrentUser() user: JwtUser, @Query() query: ListMaintenanceQueryDto) {
    return this.maintenanceService.findAll(user, query);
  }

  @Post()
  create(@CurrentUser() user: JwtUser, @Body() dto: CreateMaintenanceDto) {
    return this.maintenanceService.create(user, dto);
  }

  @Get(":id")
  findOne(@CurrentUser() user: JwtUser, @Param("id", ParseIntPipe) id: number) {
    return this.maintenanceService.findOne(user, id);
  }

  @Patch(":id/start")
  start(@CurrentUser() user: JwtUser, @Param("id", ParseIntPipe) id: number) {
    return this.maintenanceService.start(user, id);
  }

  @Patch(":id/close")
  close(
    @CurrentUser() user: JwtUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: CloseMaintenanceDto
  ) {
    return this.maintenanceService.close(user, id, dto);
  }

  @Patch(":id/cancel")
  cancel(@CurrentUser() user: JwtUser, @Param("id", ParseIntPipe) id: number) {
    return this.maintenanceService.cancel(user, id);
  }
}
