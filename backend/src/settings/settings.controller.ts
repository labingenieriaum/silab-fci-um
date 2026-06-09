import { Body, Controller, Get, Patch } from "@nestjs/common";
import { Permissions } from "../common/decorators/permissions.decorator";
import { SettingsService } from "./settings.service";

@Controller("settings")
@Permissions("usuarios:gestionar")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get("email")
  getEmailSettings() {
    return this.settingsService.getEmailSettings();
  }

  @Patch("email")
  saveEmailSettings(@Body() body: Record<string, unknown>) {
    return this.settingsService.saveEmailSettings(body);
  }

  @Get("email-templates")
  getEmailTemplates() {
    return this.settingsService.getEmailTemplates();
  }

  @Patch("email-templates")
  saveEmailTemplates(@Body() body: Parameters<SettingsService["saveEmailTemplates"]>[0]) {
    return this.settingsService.saveEmailTemplates(body);
  }
}
