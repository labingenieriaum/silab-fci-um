import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { AcademicModule } from "./academic/academic.module";
import { AppController } from "./app.controller";
import { AuthModule } from "./auth/auth.module";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { PermissionsGuard } from "./common/guards/permissions.guard";
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
    AuthModule,
    UsersModule,
    RolesModule,
    AcademicModule,
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
    }
  ]
})
export class AppModule {}
