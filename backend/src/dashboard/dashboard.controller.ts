import { Controller, Get } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Permissions } from "../common/decorators/permissions.decorator";
import type { JwtUser } from "../common/types/jwt-user";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get()
  @Permissions("dashboard:ver")
  getDashboard(@CurrentUser() user: JwtUser) {
    return this.dashboardService.getDashboard(user);
  }
}
