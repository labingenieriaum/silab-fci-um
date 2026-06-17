import { Controller, Get, Query } from "@nestjs/common";
import { Permissions } from "../common/decorators/permissions.decorator";
import { AuditService } from "./audit.service";

@Controller("audit")
@Permissions("auditoria:ver")
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  findAll(@Query("page") page?: string, @Query("pageSize") pageSize?: string, @Query("search") search?: string) {
    return this.auditService.findAll({
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      search
    });
  }
}
