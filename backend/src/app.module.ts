import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { AcademicModule } from "./academic/academic.module";
import { AgreementsModule } from "./agreements/agreements.module";
import { AppController } from "./app.controller";
import { AuditModule } from "./audit/audit.module";
import { AuditInterceptor } from "./audit/audit.interceptor";
import { AuthModule } from "./auth/auth.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { PermissionsGuard } from "./common/guards/permissions.guard";
import { DashboardModule } from "./dashboard/dashboard.module";
import { InventoryModule } from "./inventory/inventory.module";
import { LaboratoriesModule } from "./laboratories/laboratories.module";
import { LoansModule } from "./loans/loans.module";
import { MailModule } from "./mail/mail.module";
import { MaintenanceModule } from "./maintenance/maintenance.module";
import { PeopleModule } from "./people/people.module";
import { PrismaModule } from "./prisma/prisma.module";
import { ReportsModule } from "./reports/reports.module";
import { validateEnv } from "./config/env.validation";
import { RolesModule } from "./roles/roles.module";
import { SettingsModule } from "./settings/settings.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
      validate: validateEnv
    }),
    PrismaModule,
    AuditModule,
    AuthModule,
    UsersModule,
    RolesModule,
    AgreementsModule,
    AcademicModule,
    DashboardModule,
    LaboratoriesModule,
    InventoryModule,
    LoansModule,
    MailModule,
    MaintenanceModule,
    PeopleModule,
    ReportsModule,
    SettingsModule
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor
    }
  ]
})
export class AppModule {}
