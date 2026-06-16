import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, Loader2, Mail, Printer } from "lucide-react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, downloadApiFile } from "@/lib/api";
import { formatDateTime, formatEnum } from "@/lib/format";
import type { Loan } from "@/types/loans";

export function DeliveryActPage() {
  const { id } = useParams();
  const loanId = Number(id);
  const actQuery = useQuery({
    queryKey: ["delivery-act", loanId],
    enabled: Number.isFinite(loanId),
    queryFn: () => apiRequest<Loan>(`/loans/${loanId}/delivery-act`)
  });

  const act = actQuery.data;
  const emailMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ sent: boolean; to: string }>(`/loans/${loanId}/delivery-act/email`, {
        method: "POST",
        body: JSON.stringify({})
      })
  });
  const photos = act?.evidencias.filter((evidence) => evidence.tipo === "FOTO") ?? [];
  const signatures = act?.evidencias.filter((evidence) => evidence.tipo !== "FOTO") ?? [];

  return (
    <div className="mx-auto max-w-5xl space-y-4 print:bg-white">
      <section className="flex flex-col justify-between gap-3 print:hidden sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Acta de entrega</h1>
          <p className="text-sm text-muted-foreground">Visualizacion, impresion y descarga del acta.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            Imprimir
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (window.confirm("Quieres descargar el PDF del acta de entrega?")) {
                void downloadApiFile(`/reports/acts/loans/${loanId}.pdf`, `acta-entrega-${loanId}.pdf`);
              }
            }}
          >
            <Download className="h-4 w-4" />
            Descargar PDF
          </Button>
          <Button type="button" disabled={!act || emailMutation.isPending} onClick={() => emailMutation.mutate()}>
            <Mail className="h-4 w-4" />
            {emailMutation.isPending ? "Enviando..." : "Enviar por correo"}
          </Button>
        </div>
      </section>

      {emailMutation.data?.sent && (
        <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary print:hidden">
          Acta enviada a {emailMutation.data.to}.
        </div>
      )}
      {emailMutation.error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive print:hidden">
          {emailMutation.error instanceof Error ? emailMutation.error.message : "No fue posible enviar el acta."}
        </div>
      )}

      {actQuery.isLoading && (
        <Card>
          <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando acta...
          </CardContent>
        </Card>
      )}

      {act && (
        <Card className="overflow-hidden print:border-none print:shadow-none">
          <CardHeader className="border-b bg-[#103b25] p-0 text-white">
            <div className="relative overflow-hidden p-8">
              <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(#a8c66c_1px,transparent_1px)] [background-size:22px_22px]" />
              <div className="relative flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
                <div className="flex items-center gap-4">
                  <img className="h-16 w-16 rounded-md bg-white object-contain p-1" src="/assets/logo-mark.png" alt="SILAB FCI" />
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-[#b6d37b]">SILAB FCI</p>
                    <CardTitle className="text-2xl text-white">Acta de entrega</CardTitle>
                    <p className="mt-1 text-sm text-white/80">Facultad de Ciencias e Ingenieria</p>
                  </div>
                </div>
                <div className="rounded-md bg-[#aeca6f] px-4 py-3 text-[#10201a]">
                  <p className="text-xs font-bold uppercase">Prestamo</p>
                  <p className="text-lg font-bold">{act.codigo}</p>
                </div>
              </div>
              <div className="relative mt-8 border-t border-white/25 pt-4 text-sm text-white/80">
                {act.fechaEntrega ? formatDateTime(act.fechaEntrega) : "Entrega sin fecha registrada"}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <section className="grid gap-4 sm:grid-cols-2">
              <Info label="Solicitante" value={getLoanRequesterName(act)} />
              <Info label="Correo solicitante" value={getLoanRequesterEmail(act)} />
              <Info label="Documento" value={getLoanRequesterDocument(act)} />
              <Info label="Entregado por" value={act.entregadoPor?.nombre ?? "Sin responsable"} />
              <Info label="Fecha requerida" value={act.fechaRequerida ? formatDateTime(act.fechaRequerida) : "N/A"} />
              <Info label="Devolucion estimada" value={formatDateTime(act.fechaDevolucionEstimada)} />
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Equipos entregados</h2>
              <div className="overflow-hidden rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/70 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Equipo</th>
                      <th className="px-3 py-2 text-left">Unidad</th>
                      <th className="px-3 py-2 text-left">Cantidad</th>
                      <th className="px-3 py-2 text-left">Condicion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {act.detalles.map((detail) => (
                      <tr key={detail.id} className="border-t">
                        <td className="px-3 py-2">
                          <div className="font-medium">{detail.equipo.nombre}</div>
                          <div className="text-xs text-muted-foreground">{detail.equipo.codigoInterno}</div>
                        </td>
                        <td className="px-3 py-2">{detail.equipoUnidad?.codigoInterno ?? "N/A"}</td>
                        <td className="px-3 py-2">{detail.cantidadEntregada}</td>
                        <td className="px-3 py-2">{formatEnum(detail.estadoEntrega ?? "NO_APLICA")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Observaciones</h2>
              <div className="rounded-md border bg-muted/20 px-3 py-3 text-sm">
                {act.observaciones?.trim() || "No hubo comentarios."}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Fotos</h2>
              {photos.length ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  {photos.map((photo) => (
                    <img key={photo.id} className="h-40 w-full rounded-md border object-cover" src={photo.contenidoBase64} alt={photo.nombreArchivo ?? "Foto de entrega"} />
                  ))}
                </div>
              ) : (
                <p className="rounded-md border border-dashed bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
                  Sin fotos subidas.
                </p>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Firmas</h2>
              {signatures.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {signatures.map((signature) => (
                    <div key={signature.id} className="rounded-md border bg-white p-3">
                      <img className="h-28 w-full object-contain" src={signature.contenidoBase64} alt={signature.firmanteNombre ?? signature.tipo} />
                      <p className="mt-2 text-center text-xs font-medium">{signature.firmanteNombre ?? formatEnum(signature.tipo)}</p>
                      <p className="text-center text-[11px] text-muted-foreground">{formatEnum(signature.tipo)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="rounded-md border border-dashed bg-muted/20 px-3 py-3 text-sm text-muted-foreground">
                  No hay firmas registradas.
                </p>
              )}
            </section>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getLoanRequesterName(loan: Loan) {
  return loan.personaSolicitante?.nombre ?? loan.usuarioSolicitante?.nombre ?? loan.solicitanteNombre ?? "Solicitante";
}

function getLoanRequesterEmail(loan: Loan) {
  return loan.personaSolicitante?.correoInstitucional ?? loan.usuarioSolicitante?.correo ?? loan.solicitanteCorreo ?? "";
}

function getLoanRequesterDocument(loan: Loan) {
  return loan.personaSolicitante?.codigo ?? loan.usuarioSolicitante?.documento ?? loan.solicitanteDocumento ?? "";
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 px-3 py-2">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
