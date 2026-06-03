import { Controller, Get } from "@nestjs/common";
import { Permissions } from "../common/decorators/permissions.decorator";
import { RolesService } from "./roles.service";

@Controller()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get("roles")
  @Permissions("usuarios:gestionar")
  findRoles() {
    return this.rolesService.findRoles();
  }

  @Get("permissions")
  @Permissions("usuarios:gestionar")
  findPermissions() {
    return this.rolesService.findPermissions();
  }
}

