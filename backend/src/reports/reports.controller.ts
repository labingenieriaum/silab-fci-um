import { Controller, Get, Param, ParseIntPipe, Res } from "@nestjs/common";
import type { Response } from "express";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Permissions } from "../common/decorators/permissions.decorator";
import type { JwtUser } from "../common/types/jwt-user";
import { ReportsService } from "./reports.service";

@Controller("reports")
@Permissions("reportes:ver")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get("inventory.xlsx")
  async inventoryXlsx(@CurrentUser() user: JwtUser, @Res() response: Response) {
    this.sendFile(response, await this.reportsService.inventoryXlsx(user), "inventario.xlsx");
  }

  @Get("inventory.pdf")
  async inventoryPdf(@CurrentUser() user: JwtUser, @Res() response: Response) {
    this.sendFile(response, await this.reportsService.inventoryPdf(user), "inventario.pdf");
  }

  @Get("loans.xlsx")
  async loansXlsx(@CurrentUser() user: JwtUser, @Res() response: Response) {
    this.sendFile(response, await this.reportsService.loansXlsx(user), "prestamos.xlsx");
  }

  @Get("loans.pdf")
  async loansPdf(@CurrentUser() user: JwtUser, @Res() response: Response) {
    this.sendFile(response, await this.reportsService.loansPdf(user), "prestamos.pdf");
  }

  @Get("maintenance.xlsx")
  async maintenanceXlsx(@CurrentUser() user: JwtUser, @Res() response: Response) {
    this.sendFile(
      response,
      await this.reportsService.maintenanceXlsx(user),
      "mantenimientos.xlsx"
    );
  }

  @Get("maintenance.pdf")
  async maintenancePdf(@CurrentUser() user: JwtUser, @Res() response: Response) {
    this.sendFile(response, await this.reportsService.maintenancePdf(user), "mantenimientos.pdf");
  }

  @Get("acts/loans/:id.pdf")
  async loanAct(
    @CurrentUser() user: JwtUser,
    @Param("id", ParseIntPipe) id: number,
    @Res() response: Response
  ) {
    this.sendFile(response, await this.reportsService.loanActPdf(user, id), `acta-prestamo-${id}.pdf`);
  }

  @Get("acts/returns/:id.pdf")
  async returnAct(
    @CurrentUser() user: JwtUser,
    @Param("id", ParseIntPipe) id: number,
    @Res() response: Response
  ) {
    this.sendFile(response, await this.reportsService.returnActPdf(user, id), `acta-devolucion-${id}.pdf`);
  }

  private sendFile(response: Response, file: { buffer: Buffer; contentType: string }, filename: string) {
    response.setHeader("Content-Type", file.contentType);
    response.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    response.send(file.buffer);
  }
}
