import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "../decorators/public.decorator";
import { PERMISSIONS_KEY } from "../decorators/permissions.decorator";
import type { AuthenticatedRequest } from "../types/authenticated-request";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userPermissions = request.user?.permissions ?? [];
    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      throw new ForbiddenException("You do not have permission for this action.");
    }

    return true;
  }
}

