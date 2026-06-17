import { Body, Controller, Get, Post, Req, Res } from "@nestjs/common";
import type { Request, Response } from "express";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { Public } from "../common/decorators/public.decorator";
import type { JwtUser } from "../common/types/jwt-user";
import { AuthService } from "./auth.service";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { LoginDto } from "./dto/login.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) response: Response) {
    const auth = await this.authService.login(dto);
    this.setRefreshCookie(response, auth.refreshToken);
    return {
      accessToken: auth.accessToken,
      user: auth.user
    };
  }

  @Public()
  @Post("refresh")
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const auth = await this.authService.refresh(request.cookies?.refreshToken);
    this.setRefreshCookie(response, auth.refreshToken);
    return {
      accessToken: auth.accessToken,
      user: auth.user
    };
  }

  @Post("logout")
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await this.authService.logout(request.cookies?.refreshToken);
    response.clearCookie("refreshToken", this.getRefreshCookieOptions());
    return { status: "ok" };
  }

  @Get("me")
  async me(@CurrentUser() currentUser?: JwtUser) {
    return this.authService.me(currentUser);
  }

  @Post("change-password")
  async changePassword(@CurrentUser() currentUser: JwtUser, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(currentUser, dto);
  }

  private setRefreshCookie(response: Response, token: string) {
    response.cookie("refreshToken", token, this.getRefreshCookieOptions());
  }

  private getRefreshCookieOptions() {
    const sameSite = process.env.COOKIE_SAME_SITE ?? "strict";

    return {
      httpOnly: true,
      sameSite: sameSite as "strict" | "lax" | "none",
      secure: process.env.NODE_ENV === "production",
      path: "/api/v1/auth",
      maxAge: 7 * 24 * 60 * 60 * 1000
    };
  }
}

