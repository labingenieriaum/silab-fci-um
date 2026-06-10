import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from "@nestjs/common";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Permissions } from "../common/decorators/permissions.decorator";
import { Public } from "../common/decorators/public.decorator";
import type { JwtUser } from "../common/types/jwt-user";
import { ApproveLoanDto } from "./dto/approve-loan.dto";
import { CreateLoanDto } from "./dto/create-loan.dto";
import { CreatePublicLoanRequestDto } from "./dto/create-public-loan-request.dto";
import { DeliverLoanDto } from "./dto/deliver-loan.dto";
import { ListLoansQueryDto } from "./dto/list-loans-query.dto";
import { RegisterReturnDto } from "./dto/register-return.dto";
import { RejectLoanDto } from "./dto/reject-loan.dto";
import { SendReturnActEmailDto } from "./dto/send-return-act-email.dto";
import { UpdatePublicLoanRequestDto } from "./dto/update-public-loan-request.dto";
import { LoansService } from "./loans.service";

@Controller()
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  @Public()
  @Get("public/loan-resources")
  findPublicLoanResources(@Query("search") search?: string) {
    return this.loansService.findPublicLoanResources(search);
  }

  @Public()
  @Post("public/loan-requests")
  createPublicLoanRequest(@Body() dto: CreatePublicLoanRequestDto) {
    return this.loansService.createPublicLoanRequest(dto);
  }

  @Get("loan-requests")
  @Permissions("prestamos:aprobar")
  findPublicLoanRequests(@CurrentUser() user: JwtUser) {
    return this.loansService.findPublicLoanRequests(user);
  }

  @Patch("loan-requests/:id/status")
  @Permissions("prestamos:aprobar")
  updatePublicLoanRequest(
    @CurrentUser() user: JwtUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdatePublicLoanRequestDto
  ) {
    return this.loansService.updatePublicLoanRequest(user, id, dto);
  }

  @Get("loans")
  findLoans(@CurrentUser() user: JwtUser, @Query() query: ListLoansQueryDto) {
    return this.loansService.findLoans(user, query);
  }

  @Post("loans")
  @Permissions("prestamos:solicitar")
  createLoan(@CurrentUser() user: JwtUser, @Body() dto: CreateLoanDto) {
    return this.loansService.createLoan(user, dto);
  }

  @Get("loans/:id")
  findLoanById(@CurrentUser() user: JwtUser, @Param("id", ParseIntPipe) id: number) {
    return this.loansService.findLoanById(user, id);
  }

  @Get("loans/:id/delivery-act")
  findLoanDeliveryAct(@CurrentUser() user: JwtUser, @Param("id", ParseIntPipe) id: number) {
    return this.loansService.findLoanDeliveryAct(user, id);
  }

  @Patch("loans/:id/approve")
  @Permissions("prestamos:aprobar")
  approveLoan(
    @CurrentUser() user: JwtUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: ApproveLoanDto
  ) {
    return this.loansService.approveLoan(user, id, dto);
  }

  @Patch("loans/:id/reject")
  @Permissions("prestamos:aprobar")
  rejectLoan(
    @CurrentUser() user: JwtUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: RejectLoanDto
  ) {
    return this.loansService.rejectLoan(user, id, dto);
  }

  @Patch("loans/:id/deliver")
  @Permissions("prestamos:entregar")
  deliverLoan(
    @CurrentUser() user: JwtUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: DeliverLoanDto
  ) {
    return this.loansService.deliverLoan(user, id, dto);
  }

  @Post("loans/:id/due-soon-email")
  @Permissions("prestamos:aprobar")
  sendLoanDueSoonEmail(@CurrentUser() user: JwtUser, @Param("id", ParseIntPipe) id: number) {
    return this.loansService.sendLoanDueSoonEmail(user, id);
  }

  @Post("loans/:id/returns")
  @Permissions("devoluciones:registrar")
  registerReturn(
    @CurrentUser() user: JwtUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: RegisterReturnDto
  ) {
    return this.loansService.registerReturn(user, id, dto);
  }

  @Get("returns")
  findReturns(@CurrentUser() user: JwtUser, @Query("loanId") loanId?: string) {
    return this.loansService.findReturns(user, loanId ? Number(loanId) : undefined);
  }

  @Get("returns/:id/act")
  findReturnAct(@CurrentUser() user: JwtUser, @Param("id", ParseIntPipe) id: number) {
    return this.loansService.findReturnAct(user, id);
  }

  @Post("returns/:id/act/email")
  @Permissions("devoluciones:registrar")
  sendReturnActEmail(
    @CurrentUser() user: JwtUser,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: SendReturnActEmailDto
  ) {
    return this.loansService.sendReturnActEmail(user, id, dto);
  }
}
