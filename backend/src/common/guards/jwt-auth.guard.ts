import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import type { AuthenticatedRequest } from "../types/authenticated-request";
import type { JwtUser } from "../types/jwt-user";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException("Authentication token is required.");
    }

    try {
      request.user = await this.jwtService.verifyAsync<JwtUser>(token, {
        secret: this.configService.getOrThrow<string>("JWT_ACCESS_SECRET")
      });
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired authentication token.");
    }
  }

  private extractToken(request: AuthenticatedRequest) {
    const authHeader = request.headers.authorization;
    const [type, token] = authHeader?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}

