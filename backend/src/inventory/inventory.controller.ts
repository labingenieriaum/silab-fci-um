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
import { CreateEquipmentCategoryDto } from "./dto/create-equipment-category.dto";
import { CreateEquipmentUnitDto } from "./dto/create-equipment-unit.dto";
import { CreateEquipmentDto } from "./dto/create-equipment.dto";
import {
  ListInventoryMovementsQueryDto,
  RegisterInventoryAdjustmentDto,
  RegisterInventoryEntryDto,
  RegisterInventoryTransferDto
} from "./dto/inventory-movement.dto";
import { ListEquipmentQueryDto } from "./dto/list-equipment-query.dto";
import { UpdateEquipmentCategoryDto } from "./dto/update-equipment-category.dto";
import { UpdateEquipmentUnitDto } from "./dto/update-equipment-unit.dto";
import { UpdateEquipmentDto } from "./dto/update-equipment.dto";
import { InventoryService } from "./inventory.service";

@Controller()
@Permissions("inventario:gestionar")
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get("equipment-categories")
  findCategories() {
    return this.inventoryService.findCategories();
  }

  @Post("equipment-categories")
  createCategory(@Body() dto: CreateEquipmentCategoryDto) {
    return this.inventoryService.createCategory(dto);
  }

  @Patch("equipment-categories/:id")
  updateCategory(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateEquipmentCategoryDto
  ) {
    return this.inventoryService.updateCategory(id, dto);
  }

  @Delete("equipment-categories/:id")
  removeCategory(@Param("id", ParseIntPipe) id: number) {
    return this.inventoryService.removeCategory(id);
  }

  @Get("equipment")
  findEquipment(@CurrentUser() user: JwtUser, @Query() query: ListEquipmentQueryDto) {
    return this.inventoryService.findEquipment(user, query);
  }

  @Post("equipment")
  createEquipment(@CurrentUser() user: JwtUser, @Body() dto: CreateEquipmentDto) {
    return this.inventoryService.createEquipment(user, dto);
  }

  @Get("equipment/lookup")
  lookupEquipment(@CurrentUser() user: JwtUser, @Query("code") code?: string) {
    return this.inventoryService.lookupEquipment(user, code);
  }

  @Get("equipment/:id/units")
  findEquipmentUnits(@CurrentUser() user: JwtUser, @Param("id", ParseIntPipe) id: number) {
    return this.inventoryService.findEquipmentUnits(user, id);
  }

  @Post("equipment/:id/units")
  createEquipmentUnit(
    @CurrentUser() user: JwtUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: CreateEquipmentUnitDto
  ) {
    return this.inventoryService.createEquipmentUnit(user, id, dto);
  }

  @Get("equipment/:id")
  findEquipmentById(@CurrentUser() user: JwtUser, @Param("id", ParseIntPipe) id: number) {
    return this.inventoryService.findEquipmentById(user, id);
  }

  @Patch("equipment/:id")
  updateEquipment(
    @CurrentUser() user: JwtUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateEquipmentDto
  ) {
    return this.inventoryService.updateEquipment(user, id, dto);
  }

  @Delete("equipment/:id")
  removeEquipment(@CurrentUser() user: JwtUser, @Param("id", ParseIntPipe) id: number) {
    return this.inventoryService.removeEquipment(user, id);
  }

  @Patch("equipment-units/:id")
  updateEquipmentUnit(
    @CurrentUser() user: JwtUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateEquipmentUnitDto
  ) {
    return this.inventoryService.updateEquipmentUnit(user, id, dto);
  }

  @Delete("equipment-units/:id")
  removeEquipmentUnit(@CurrentUser() user: JwtUser, @Param("id", ParseIntPipe) id: number) {
    return this.inventoryService.removeEquipmentUnit(user, id);
  }

  @Get("inventory-movements")
  findMovements(@CurrentUser() user: JwtUser, @Query() query: ListInventoryMovementsQueryDto) {
    return this.inventoryService.findMovements(user, query);
  }

  @Post("inventory-movements/entry")
  registerEntry(@CurrentUser() user: JwtUser, @Body() dto: RegisterInventoryEntryDto) {
    return this.inventoryService.registerEntry(user, dto);
  }

  @Post("inventory-movements/adjustment")
  registerAdjustment(
    @CurrentUser() user: JwtUser,
    @Body() dto: RegisterInventoryAdjustmentDto
  ) {
    return this.inventoryService.registerAdjustment(user, dto);
  }

  @Post("inventory-movements/transfer")
  registerTransfer(@CurrentUser() user: JwtUser, @Body() dto: RegisterInventoryTransferDto) {
    return this.inventoryService.registerTransfer(user, dto);
  }
}
