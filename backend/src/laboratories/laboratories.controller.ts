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
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Permissions } from "../common/decorators/permissions.decorator";
import type { JwtUser } from "../common/types/jwt-user";
import { CreateLaboratoryDto } from "./dto/create-laboratory.dto";
import { CreateLocationDto } from "./dto/create-location.dto";
import { ListLaboratoriesQueryDto } from "./dto/list-laboratories-query.dto";
import { ListLocationsQueryDto } from "./dto/list-locations-query.dto";
import { UpdateLaboratoryDto } from "./dto/update-laboratory.dto";
import { UpdateLocationDto } from "./dto/update-location.dto";
import { LaboratoriesService } from "./laboratories.service";

@Controller()
@Permissions("laboratorios:gestionar")
export class LaboratoriesController {
  constructor(private readonly laboratoriesService: LaboratoriesService) {}

  @Get("laboratories")
  findLaboratories(@CurrentUser() user: JwtUser, @Query() query: ListLaboratoriesQueryDto) {
    return this.laboratoriesService.findLaboratories(user, query);
  }

  @Post("laboratories")
  createLaboratory(@CurrentUser() user: JwtUser, @Body() dto: CreateLaboratoryDto) {
    return this.laboratoriesService.createLaboratory(user, dto);
  }

  @Get("laboratories/:id")
  findLaboratory(@CurrentUser() user: JwtUser, @Param("id", ParseIntPipe) id: number) {
    return this.laboratoriesService.findLaboratory(user, id);
  }

  @Patch("laboratories/:id")
  updateLaboratory(
    @CurrentUser() user: JwtUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateLaboratoryDto
  ) {
    return this.laboratoriesService.updateLaboratory(user, id, dto);
  }

  @Delete("laboratories/:id")
  removeLaboratory(@CurrentUser() user: JwtUser, @Param("id", ParseIntPipe) id: number) {
    return this.laboratoriesService.removeLaboratory(user, id);
  }

  @Get("locations")
  findLocations(@CurrentUser() user: JwtUser, @Query() query: ListLocationsQueryDto) {
    return this.laboratoriesService.findLocations(user, query);
  }

  @Get("locations/tree")
  findLocationTree(@CurrentUser() user: JwtUser, @Query("laboratorioId") laboratorioId?: string) {
    return this.laboratoriesService.findLocationTree(
      user,
      laboratorioId ? Number(laboratorioId) : undefined
    );
  }

  @Post("locations")
  createLocation(@CurrentUser() user: JwtUser, @Body() dto: CreateLocationDto) {
    return this.laboratoriesService.createLocation(user, dto);
  }

  @Get("locations/:id")
  findLocation(@CurrentUser() user: JwtUser, @Param("id", ParseIntPipe) id: number) {
    return this.laboratoriesService.findLocation(user, id);
  }

  @Patch("locations/:id")
  updateLocation(
    @CurrentUser() user: JwtUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateLocationDto
  ) {
    return this.laboratoriesService.updateLocation(user, id, dto);
  }

  @Delete("locations/:id")
  removeLocation(@CurrentUser() user: JwtUser, @Param("id", ParseIntPipe) id: number) {
    return this.laboratoriesService.removeLocation(user, id);
  }
}
