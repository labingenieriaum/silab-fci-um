import {
  Injectable,
  NotFoundException,
  UnauthorizedException
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import type { JwtSignOptions } from "@nestjs/jwt";
import type { Prisma } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import type { JwtUser } from "../common/types/jwt-user";
import { LoginDto } from "./dto/login.dto";
import type { AuthResponse, AuthUserResponse } from "./types/auth-response";

const authUserInclude = {
  rol: {
    include: {
      permisos: {
        include: {
          permiso: true
        }
      }
    }
  },
  facultad: true,
  programa: true
} satisfies Prisma.UsuarioInclude;

type UserWithAuthRelations = Prisma.UsuarioGetPayload<{
  include: typeof authUserInclude;
}>;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async login(dto: LoginDto): Promise<AuthResponse & { refreshToken: string }> {
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        correo: dto.correo.trim().toLowerCase(),
        deletedAt: null
      },
      include: authUserInclude
    });

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    const isPasswordValid = await bcrypt.compare(dto.password, usuario.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials.");
    }

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoAcceso: new Date() }
    });

    return this.createAuthResponse(usuario);
  }

  async refresh(refreshToken?: string): Promise<AuthResponse & { refreshToken: string }> {
    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token is required.");
    }

    const payload = await this.jwtService
      .verifyAsync<{ sub: number; tokenId: string }>(refreshToken, {
        secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET")
      })
      .catch(() => null);

    if (!payload) {
      throw new UnauthorizedException("Invalid refresh token.");
    }

    const tokenHash = this.hashToken(refreshToken);
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash }
    });

    if (
      !storedToken ||
      storedToken.usuarioId !== payload.sub ||
      storedToken.revokedAt ||
      storedToken.expiresAt <= new Date()
    ) {
      throw new UnauthorizedException("Invalid refresh token.");
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() }
    });

    const usuario = await this.prisma.usuario.findFirst({
      where: {
        id: payload.sub,
        activo: true,
        deletedAt: null
      },
      include: authUserInclude
    });

    if (!usuario) {
      throw new UnauthorizedException("User is not active.");
    }

    return this.createAuthResponse(usuario);
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return;
    }

    await this.prisma.refreshToken
      .update({
        where: { tokenHash: this.hashToken(refreshToken) },
        data: { revokedAt: new Date() }
      })
      .catch(() => undefined);
  }

  async me(currentUser?: JwtUser): Promise<AuthUserResponse> {
    if (!currentUser) {
      throw new UnauthorizedException("Authentication is required.");
    }

    const usuario = await this.prisma.usuario.findFirst({
      where: {
        id: currentUser.sub,
        activo: true,
        deletedAt: null
      },
      include: authUserInclude
    });

    if (!usuario) {
      throw new NotFoundException("User not found.");
    }

    return this.toAuthUser(usuario);
  }

  private async createAuthResponse(
    usuario: UserWithAuthRelations
  ): Promise<AuthResponse & { refreshToken: string }> {
    const user = this.toAuthUser(usuario);
    const payload: JwtUser = {
      sub: usuario.id,
      correo: usuario.correo,
      nombre: usuario.nombre,
      rolId: usuario.rolId,
      rol: usuario.rol.nombre,
      tipoUsuario: usuario.tipoUsuario,
      facultadId: usuario.facultadId,
      programaId: usuario.programaId,
      permissions: user.permissions
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>("JWT_ACCESS_SECRET"),
      expiresIn: this.configService.get<string>(
        "JWT_ACCESS_EXPIRES_IN",
        "15m"
      ) as JwtSignOptions["expiresIn"]
    });

    const tokenId = randomBytes(16).toString("hex");
    const refreshToken = await this.jwtService.signAsync(
      { sub: usuario.id, tokenId },
      {
        secret: this.configService.getOrThrow<string>("JWT_REFRESH_SECRET"),
        expiresIn: this.configService.get<string>(
          "JWT_REFRESH_EXPIRES_IN",
          "7d"
        ) as JwtSignOptions["expiresIn"]
      }
    );

    await this.prisma.refreshToken.create({
      data: {
        usuarioId: usuario.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    return {
      accessToken,
      refreshToken,
      user
    };
  }

  private toAuthUser(usuario: UserWithAuthRelations): AuthUserResponse {
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      documento: usuario.documento,
      tipoUsuario: usuario.tipoUsuario,
      activo: usuario.activo,
      rol: {
        id: usuario.rol.id,
        nombre: usuario.rol.nombre,
        descripcion: usuario.rol.descripcion
      },
      facultad: usuario.facultad
        ? {
            id: usuario.facultad.id,
            nombre: usuario.facultad.nombre,
            sigla: usuario.facultad.sigla
          }
        : null,
      programa: usuario.programa
        ? {
            id: usuario.programa.id,
            nombre: usuario.programa.nombre,
            codigo: usuario.programa.codigo
          }
        : null,
      permissions: usuario.rol.permisos.map((rolPermiso) => rolPermiso.permiso.codigo)
    };
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }
}
