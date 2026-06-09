import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function VerifyReportPage() {
  const { code } = useParams();
  const reportCode = code ? decodeURIComponent(code) : "Sin codigo";

  return (
    <main className="grid min-h-screen place-items-center bg-[#0c3b22] px-4 py-10">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <div className="mb-3 grid h-12 w-12 place-items-center rounded-md bg-[#e4f3ea] text-[#155c37]">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle>Verificacion de reporte SIILAB FCI</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="rounded-md border bg-muted/40 p-4">
            <div className="flex items-center gap-2 font-semibold text-[#155c37]">
              <CheckCircle2 className="h-4 w-4" />
              Reporte institucional real
            </div>
            <p className="mt-2">
              Este codigo corresponde a un reporte generado desde la plataforma SIILAB FCI.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Codigo de verificacion
            </p>
            <p className="mt-1 font-mono text-base font-semibold text-foreground">{reportCode}</p>
          </div>
          <p>
            Para validar el documento, compara este codigo con el impreso en el pie del PDF. Si no
            coincide, solicita una nueva copia desde la plataforma.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
