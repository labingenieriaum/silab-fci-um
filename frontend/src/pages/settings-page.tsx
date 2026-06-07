import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { apiRequest } from "@/lib/api";

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

type TemplateKey = "returnAct" | "loanDueSoon" | "publicLoanApproved";

type EmailTemplates = Record<TemplateKey, { subject: string; body: string }>;

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [providerValue, setProviderValue] = useState<EmailSettings["provider"]>("google");

  const settingsQuery = useQuery({
    queryKey: ["email-settings"],
    queryFn: () => apiRequest<EmailSettings>("/settings/email")
  });

  const templatesQuery = useQuery({
    queryKey: ["email-templates"],
    queryFn: () => apiRequest<EmailTemplates>("/settings/email-templates")
  });

  const saveSettingsMutation = useMutation({
    mutationFn: (settings: EmailSettings) =>
      apiRequest<EmailSettings>("/settings/email", {
        method: "PATCH",
        body: JSON.stringify(settings)
      }),
    onSuccess: async () => {
      setFeedback("Configuracion SMTP guardada.");
      await queryClient.invalidateQueries({ queryKey: ["email-settings"] });
    },
    onError: setErrorFeedback
  });

  const saveTemplatesMutation = useMutation({
    mutationFn: (templates: EmailTemplates) =>
      apiRequest<EmailTemplates>("/settings/email-templates", {
        method: "PATCH",
        body: JSON.stringify(templates)
      }),
    onSuccess: async () => {
      setFeedback("Plantillas de correo guardadas.");
      await queryClient.invalidateQueries({ queryKey: ["email-templates"] });
    },
    onError: setErrorFeedback
  });

  function setErrorFeedback(error: unknown) {
    setFeedback(error instanceof Error ? error.message : "No fue posible guardar la configuracion.");
  }

  function handleSettingsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const provider = String(form.get("provider")) as EmailSettings["provider"];
    saveSettingsMutation.mutate({
      provider,
      host: String(form.get("host") ?? ""),
      port: Number(form.get("port") ?? 465),
      secure: form.get("secure") === "on",
      user: String(form.get("user") ?? ""),
      pass: String(form.get("pass") ?? ""),
      fromEmail: String(form.get("fromEmail") ?? ""),
      fromName: String(form.get("fromName") ?? "SIILAB FCI")
    });
  }

  function handleTemplatesSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const current = templatesQuery.data;
    if (!current) {
      return;
    }
    saveTemplatesMutation.mutate({
      returnAct: {
        subject: String(form.get("returnAct.subject") ?? ""),
        body: String(form.get("returnAct.body") ?? "")
      },
      loanDueSoon: {
        subject: String(form.get("loanDueSoon.subject") ?? ""),
        body: String(form.get("loanDueSoon.body") ?? "")
      },
      publicLoanApproved: {
        subject: String(form.get("publicLoanApproved.subject") ?? ""),
        body: String(form.get("publicLoanApproved.body") ?? "")
      }
    });
  }

  const settings = settingsQuery.data;
  const templates = templatesQuery.data;
  const pending = saveSettingsMutation.isPending || saveTemplatesMutation.isPending;

  useEffect(() => {
    if (settings?.provider) {
      setProviderValue(settings.provider);
    }
  }, [settings?.provider]);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal">Configuracion</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          SMTP y formatos de correo para actas y notificaciones.
        </p>
      </section>

      {feedback && (
        <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          {feedback}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-primary" />
            SMTP
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!settings ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <form className="space-y-4" onSubmit={handleSettingsSubmit}>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Proveedor">
                  <input type="hidden" name="provider" value={providerValue} />
                  <SearchableSelect
                    options={[
                      { value: "google", label: "Google", searchText: "gmail google" },
                      { value: "outlook", label: "Outlook", searchText: "outlook microsoft" },
                      { value: "custom", label: "Personalizado", searchText: "custom personalizado" }
                    ]}
                    value={providerValue}
                    onChange={(value) => setProviderValue(value as EmailSettings["provider"])}
                    placeholder="Seleccionar proveedor"
                    searchPlaceholder="Buscar proveedor"
                    emptyLabel="Seleccionar"
                  />
                </Field>
                <Field label="Host">
                  <input className="input-control" name="host" defaultValue={settings.host} />
                </Field>
                <Field label="Puerto">
                  <input className="input-control" name="port" type="number" defaultValue={settings.port} />
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Usuario SMTP">
                  <input className="input-control" name="user" defaultValue={settings.user} />
                </Field>
                <Field label="Contrasena o app password">
                  <input className="input-control" name="pass" type="password" placeholder={settings.pass || "App password"} />
                </Field>
                <Field label="Correo remitente">
                  <input className="input-control" name="fromEmail" defaultValue={settings.fromEmail} />
                </Field>
                <Field label="Nombre remitente">
                  <input className="input-control" name="fromName" defaultValue={settings.fromName} />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input name="secure" type="checkbox" defaultChecked={settings.secure} />
                Usar SSL/TLS directo
              </label>
              <Button type="submit" disabled={pending}>
                <Save className="h-4 w-4" />
                Guardar SMTP
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Formatos de correo</CardTitle>
        </CardHeader>
        <CardContent>
          {!templates ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <form className="space-y-5" onSubmit={handleTemplatesSubmit}>
              <TemplateFields title="Acta de devolucion" name="returnAct" template={templates.returnAct} />
              <TemplateFields title="Prestamo por vencer" name="loanDueSoon" template={templates.loanDueSoon} />
              <TemplateFields title="Solicitud publica aprobada" name="publicLoanApproved" template={templates.publicLoanApproved} />
              <p className="text-xs text-muted-foreground">
                Variables disponibles: {"{{name}}"}, {"{{loanCode}}"}, {"{{returnId}}"}, {"{{requestCode}}"}, {"{{extraMessage}}"}.
              </p>
              <Button type="submit" disabled={pending}>
                <Save className="h-4 w-4" />
                Guardar formatos
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TemplateFields({
  title,
  name,
  template
}: {
  title: string;
  name: TemplateKey;
  template: { subject: string; body: string };
}) {
  return (
    <div className="rounded-md border p-4">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-3 grid gap-3">
        <Field label="Asunto">
          <input className="input-control" name={`${name}.subject`} defaultValue={template.subject} />
        </Field>
        <Field label="Mensaje HTML">
          <textarea className="textarea-control min-h-28" name={`${name}.body`} defaultValue={template.body} />
        </Field>
      </div>
    </div>
  );
}
