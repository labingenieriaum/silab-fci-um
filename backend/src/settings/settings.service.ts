import { Injectable } from "@nestjs/common";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";

export const defaultEmailTemplates = {
  deliveryAct: {
    subject: "Acta de entrega {{loanCode}} - SIILAB FCI",
    body: "Hola {{name}},<br><br>Adjuntamos la informacion del acta de entrega del prestamo {{loanCode}}.<br><br>{{extraMessage}}<br><br>SIILAB FCI"
  },
  returnAct: {
    subject: "Acta de devolucion {{returnId}} - SIILAB FCI",
    body: "Hola {{name}},<br><br>Adjuntamos la informacion del acta de devolucion {{returnId}} del prestamo {{loanCode}}.<br><br>SIILAB FCI"
  },
  loanDueSoon: {
    subject: "Prestamo proximo a vencer - {{loanCode}}",
    body: "Hola {{name}},<br><br>Tu prestamo {{loanCode}} esta proximo a vencer. Por favor devuelve los equipos en la fecha acordada.<br><br>SIILAB FCI"
  },
  publicLoanApproved: {
    subject: "Solicitud de prestamo aprobada - {{requestCode}}",
    body: "Hola {{name}},<br><br>Tu solicitud de prestamo {{requestCode}} fue aprobada. Puedes pasar por laboratorios para recoger el equipo.<br><br>{{extraMessage}}<br><br>SIILAB FCI"
  }
};

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService
  ) {}

  getEmailSettings() {
    return this.mailService.getSafeSettings();
  }

  saveEmailSettings(settings: Record<string, unknown>) {
    return this.mailService.saveSettings(settings as Parameters<MailService["saveSettings"]>[0]);
  }

  async getEmailTemplates() {
    const record = await this.prisma.configuracionSistema.findUnique({
      where: { clave: "email.templates" }
    });
    return record
      ? { ...defaultEmailTemplates, ...JSON.parse(record.valor) }
      : defaultEmailTemplates;
  }

  async saveEmailTemplates(templates: typeof defaultEmailTemplates) {
    const merged = {
      ...(await this.getEmailTemplates()),
      ...templates
    };
    await this.prisma.configuracionSistema.upsert({
      where: { clave: "email.templates" },
      update: { valor: JSON.stringify(merged) },
      create: { clave: "email.templates", valor: JSON.stringify(merged) }
    });
    return merged;
  }
}
