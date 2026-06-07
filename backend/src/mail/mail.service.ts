import { BadRequestException, Injectable } from "@nestjs/common";
import * as net from "node:net";
import * as tls from "node:tls";
import { PrismaService } from "../prisma/prisma.service";

interface EmailSettings {
  provider: "google" | "outlook" | "custom";
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
}

interface SendMailInput {
  to: string;
  subject: string;
  html: string;
}

const defaultSettings: EmailSettings = {
  provider: "google",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  user: "",
  pass: "",
  fromEmail: "",
  fromName: "SIILAB FCI"
};

@Injectable()
export class MailService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    const record = await this.prisma.configuracionSistema.findUnique({
      where: { clave: "email.smtp" }
    });
    return record ? ({ ...defaultSettings, ...JSON.parse(record.valor) } as EmailSettings) : defaultSettings;
  }

  async saveSettings(settings: Partial<EmailSettings>) {
    if (typeof settings.pass === "string" && !settings.pass.trim()) {
      delete settings.pass;
    }
    const merged = {
      ...(await this.getSettings()),
      ...settings
    };
    if (merged.provider === "google") {
      merged.host = "smtp.gmail.com";
      merged.port = 465;
      merged.secure = true;
    }
    if (merged.provider === "outlook") {
      merged.host = "smtp.office365.com";
      merged.port = 587;
      merged.secure = false;
    }

    await this.prisma.configuracionSistema.upsert({
      where: { clave: "email.smtp" },
      update: { valor: JSON.stringify(merged) },
      create: { clave: "email.smtp", valor: JSON.stringify(merged) }
    });

    return this.safeSettings(merged);
  }

  async getSafeSettings() {
    return this.safeSettings(await this.getSettings());
  }

  async sendMail(input: SendMailInput) {
    const settings = await this.getSettings();
    if (!settings.host || !settings.user || !settings.pass || !settings.fromEmail) {
      throw new BadRequestException("La configuracion SMTP esta incompleta.");
    }

    const client = new SmtpClient(settings);
    await client.connect();
    try {
      await client.send({
        from: settings.fromEmail,
        fromName: settings.fromName,
        to: input.to,
        subject: input.subject,
        html: input.html
      });
    } finally {
      await client.quit().catch(() => undefined);
    }
  }

  private safeSettings(settings: EmailSettings) {
    return {
      ...settings,
      pass: settings.pass ? "********" : ""
    };
  }
}

class SmtpClient {
  private socket: net.Socket | tls.TLSSocket | null = null;

  constructor(private readonly settings: EmailSettings) {}

  async connect() {
    this.socket = await this.openSocket();
    await this.readResponse();
    await this.command(`EHLO siilab.local`);
    if (!this.settings.secure) {
      await this.command("STARTTLS", 220);
      this.socket = tls.connect({
        socket: this.socket,
        servername: this.settings.host
      });
      await this.command(`EHLO siilab.local`);
    }
    await this.command("AUTH LOGIN", 334);
    await this.command(Buffer.from(this.settings.user).toString("base64"), 334);
    await this.command(Buffer.from(this.settings.pass).toString("base64"), 235);
  }

  async send(input: { from: string; fromName: string; to: string; subject: string; html: string }) {
    await this.command(`MAIL FROM:<${input.from}>`);
    await this.command(`RCPT TO:<${input.to}>`);
    await this.command("DATA", 354);
    const message = [
      `From: ${input.fromName} <${input.from}>`,
      `To: ${input.to}`,
      `Subject: ${input.subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=utf-8",
      "",
      input.html.replace(/\r?\n\./g, "\n.."),
      "."
    ].join("\r\n");
    await this.write(message);
    await this.readResponse();
  }

  async quit() {
    if (this.socket) {
      await this.command("QUIT").catch(() => undefined);
      this.socket.end();
    }
  }

  private openSocket() {
    return new Promise<net.Socket | tls.TLSSocket>((resolve, reject) => {
      const socket = this.settings.secure
        ? tls.connect({ host: this.settings.host, port: this.settings.port, servername: this.settings.host })
        : net.connect({ host: this.settings.host, port: this.settings.port });
      socket.once("connect", () => resolve(socket));
      socket.once("error", reject);
    });
  }

  private async command(value: string, expected = 250) {
    await this.write(`${value}\r\n`);
    const response = await this.readResponse();
    if (!response.startsWith(String(expected)) && !(expected === 250 && response.startsWith("235"))) {
      throw new Error(`SMTP error: ${response}`);
    }
  }

  private write(value: string) {
    return new Promise<void>((resolve, reject) => {
      this.socket?.write(value, (error) => (error ? reject(error) : resolve()));
    });
  }

  private readResponse() {
    return new Promise<string>((resolve, reject) => {
      const socket = this.socket;
      if (!socket) {
        reject(new Error("SMTP socket is not connected."));
        return;
      }
      let data = "";
      const onData = (chunk: Buffer) => {
        data += chunk.toString("utf8");
        const lines = data.split(/\r?\n/).filter(Boolean);
        const last = lines.at(-1);
        if (last && /^\d{3} /.test(last)) {
          socket.off("data", onData);
          resolve(data.trim());
        }
      };
      socket.on("data", onData);
      socket.once("error", reject);
    });
  }
}
