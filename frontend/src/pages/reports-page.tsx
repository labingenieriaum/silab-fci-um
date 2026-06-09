import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { downloadApiFile } from "@/lib/api";

const reports = [
  {
    title: "Inventario",
    description: "Listado completo de equipos, cantidades, estados y ubicaciones.",
    files: [
      { label: "PDF", path: "/reports/inventory.pdf", filename: "inventario.pdf", icon: FileText },
      { label: "Excel", path: "/reports/inventory.xlsx", filename: "inventario.xlsx", icon: FileSpreadsheet }
    ]
  },
  {
    title: "Prestamos",
    description: "Solicitudes, entregas, devoluciones esperadas y cantidades por equipo.",
    files: [
      { label: "PDF", path: "/reports/loans.pdf", filename: "prestamos.pdf", icon: FileText },
      { label: "Excel", path: "/reports/loans.xlsx", filename: "prestamos.xlsx", icon: FileSpreadsheet }
    ]
  },
  {
    title: "Mantenimientos",
    description: "Historial de equipos enviados a mantenimiento y estado operativo.",
    files: [
      { label: "PDF", path: "/reports/maintenance.pdf", filename: "mantenimientos.pdf", icon: FileText },
      { label: "Excel", path: "/reports/maintenance.xlsx", filename: "mantenimientos.xlsx", icon: FileSpreadsheet }
    ]
  }
] as const;

export function ReportsPage() {
  const [pendingFile, setPendingFile] = useState<string | null>(null);
  const [loanId, setLoanId] = useState("");
  const [returnId, setReturnId] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleDownload(path: string, filename: string) {
    setFeedback(null);
    setPendingFile(path);
    try {
      await downloadApiFile(path, filename);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible descargar el archivo.");
    } finally {
      setPendingFile(null);
    }
  }

  function downloadLoanAct() {
    const id = Number(loanId);
    if (!Number.isInteger(id) || id < 1) {
      setFeedback("Ingresa un ID de prestamo valido.");
      return;
    }
    void handleDownload(`/reports/acts/loans/${id}.pdf`, `acta-prestamo-${id}.pdf`);
  }

  function downloadReturnAct() {
    const id = Number(returnId);
    if (!Number.isInteger(id) || id < 1) {
      setFeedback("Ingresa un ID de devolucion valido.");
      return;
    }
    void handleDownload(`/reports/acts/returns/${id}.pdf`, `acta-devolucion-${id}.pdf`);
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal">Reportes y actas</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Exportacion de inventario, prestamos, mantenimientos y actas operativas.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.title}>
            <CardHeader>
              <CardTitle>{report.title}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">{report.description}</p>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {report.files.map((file) => (
                <Button
                  key={file.path}
                  type="button"
                  variant="outline"
                  onClick={() => void handleDownload(file.path, file.filename)}
                  disabled={pendingFile !== null}
                >
                  {pendingFile === file.path ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <file.icon className="h-4 w-4" />
                  )}
                  {file.label}
                </Button>
              ))}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptText className="h-4 w-4 text-primary" />
              Acta de prestamo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="ID del prestamo">
              <input
                className="input-control"
                type="number"
                min="1"
                value={loanId}
                onChange={(event) => setLoanId(event.target.value)}
                placeholder="Ej. 12"
              />
            </Field>
            <Button className="w-full" type="button" onClick={downloadLoanAct} disabled={pendingFile !== null}>
              <Download className="h-4 w-4" />
              Descargar acta
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ReceiptText className="h-4 w-4 text-primary" />
              Acta de devolucion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="ID de la devolucion">
              <input
                className="input-control"
                type="number"
                min="1"
                value={returnId}
                onChange={(event) => setReturnId(event.target.value)}
                placeholder="Ej. 4"
              />
            </Field>
            <Button className="w-full" type="button" onClick={downloadReturnAct} disabled={pendingFile !== null}>
              <Download className="h-4 w-4" />
              Descargar acta
            </Button>
          </CardContent>
        </Card>
      </section>

      {feedback && (
        <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          {feedback}
        </div>
      )}
    </div>
  );
}
