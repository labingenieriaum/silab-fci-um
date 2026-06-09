import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, Loader2, Mail, Printer } from "lucide-react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest, downloadApiFile } from "@/lib/api";
import { formatDateTime, formatEnum } from "@/lib/format";
import type { LoanPerson } from "@/types/people";

interface ReturnAct {
  id: number;
  fechaDevolucion: string;
  observaciones: string | null;
  usuarioRecibe: {
    nombre: string;
    correo: string;
  };
  prestamo: {
    codigo: string;
    solicitanteNombre: string | null;
    solicitanteCorreo: string | null;
    solicitanteDocumento: string | null;
    usuarioSolicitante: {
      nombre: string;
      correo: string;
      documento: string;
    } | null;
    personaSolicitante: Pick<
      LoanPerson,
      "codigo" | "nombre" | "correoInstitucional" | "carrera" | "semestre" | "rol"
    > | null;
  };
  detalles: Array<{
    id: number;
    cantidad: number;
    estadoDevolucion: string;
    observaciones: string | null;
    equipo: {
      codigoInterno: string;
      nombre: string;
    };
    equipoUnidad: {
      codigoInterno: string;
      serial: string | null;
    } | null;
  }>;
  evidencias: Array<{
    id: number;
    tipo: "FOTO" | "FIRMA_COORDINADOR" | "FIRMA_ADMIN" | "FIRMA_SOLICITANTE";
    nombreArchivo: string | null;
    mimeType: string;
    contenidoBase64: string;
    firmanteNombre: string | null;
  }>;
}

export function ReturnActPage() {
  const { id } = useParams();
  const returnId = Number(id);
  const actQuery = useQuery({
    queryKey: ["return-act", returnId],
    enabled: Number.isFinite(returnId),
    queryFn: () => apiRequest<ReturnAct>(`/returns/${returnId}/act`)
  });

  const act = actQuery.data;
  const emailMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ sent: boolean; to: string }>(`/returns/${returnId}/act/email`, {
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
          <h1 className="text-2xl font-semibold tracking-normal">Acta de devolucion</h1>
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
            onClick={() => void downloadApiFile(`/reports/acts/returns/${returnId}.pdf`, `acta-devolucion-${returnId}.pdf`)}
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
        <Card className="print:border-none print:shadow-none">
          <CardHeader className="border-b">
            <div className="flex items-center gap-3">
              <img className="h-14 w-14 rounded-md bg-white object-contain" src="/assets/logo-mark.png" alt="SILAB FCI" />
              <div>
                <CardTitle>Acta de devolucion #{act.id}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Prestamo {act.prestamo.codigo} - {formatDateTime(act.fechaDevolucion)}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <section className="grid gap-4 sm:grid-cols-2">
              <Info label="Solicitante" value={requesterName(act)} />
              <Info label="Correo solicitante" value={requesterEmail(act)} />
              <Info label="Documento" value={requesterDocument(act)} />
              <Info label="Recibido por" value={act.usuarioRecibe.nombre} />
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Equipos devueltos</h2>
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
                        <td className="px-3 py-2">{detail.cantidad}</td>
                        <td className="px-3 py-2">{formatEnum(detail.estadoDevolucion)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Fotos</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {photos.map((photo) => (
                  <img key={photo.id} className="h-40 w-full rounded-md border object-cover" src={photo.contenidoBase64} alt={photo.nombreArchivo ?? "Foto de devolucion"} />
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Firmas</h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {signatures.map((signature) => (
                  <div key={signature.id} className="rounded-md border p-3">
                    <img className="h-24 w-full object-contain" src={signature.contenidoBase64} alt={signature.firmanteNombre ?? signature.tipo} />
                    <p className="mt-2 text-center text-xs font-medium">{signature.firmanteNombre ?? formatEnum(signature.tipo)}</p>
                  </div>
                ))}
              </div>
            </section>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function requesterName(act: ReturnAct) {
  return (
    act.prestamo.personaSolicitante?.nombre ??
    act.prestamo.usuarioSolicitante?.nombre ??
    act.prestamo.solicitanteNombre ??
    "Solicitante"
  );
}

function requesterEmail(act: ReturnAct) {
  return (
    act.prestamo.personaSolicitante?.correoInstitucional ??
    act.prestamo.usuarioSolicitante?.correo ??
    act.prestamo.solicitanteCorreo ??
    ""
  );
}

function requesterDocument(act: ReturnAct) {
  return (
    act.prestamo.personaSolicitante?.codigo ??
    act.prestamo.usuarioSolicitante?.documento ??
    act.prestamo.solicitanteDocumento ??
    ""
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 px-3 py-2">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}
