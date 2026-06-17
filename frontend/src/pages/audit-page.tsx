import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Search, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/api";
import { formatDateTime } from "@/lib/format";

interface AuditUser {
  id: number;
  nombre: string;
  correo: string;
}

interface AuditEntry {
  id: number;
  usuarioId: number | null;
  accion: string;
  modulo: string | null;
  tabla: string | null;
  registroId: string | null;
  datosAnteriores: unknown;
  datosNuevos: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
  usuario?: AuditUser | null;
}

interface AuditResponse {
  data: AuditEntry[];
  page: number;
  pageSize: number;
  total: number;
}

export function AuditPage() {
  const [search, setSearch] = useState("");
  const auditQuery = useQuery({
    queryKey: ["audit", search],
    queryFn: () =>
      apiRequest<AuditResponse>(
        `/audit?page=1&pageSize=50${search ? `&search=${encodeURIComponent(search)}` : ""}`
      )
  });

  const entries = useMemo(() => auditQuery.data?.data ?? [], [auditQuery.data]);

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Auditoria</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registro de acciones realizadas por los usuarios del sistema.
          </p>
        </div>
        <div className="flex h-10 items-center gap-2 rounded-md border bg-card px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            className="h-full w-72 bg-transparent text-sm outline-none"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar usuario, accion, modulo o registro"
          />
        </div>
      </section>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Trazabilidad
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {auditQuery.data?.total ?? 0} registros encontrados
            </p>
          </div>
          {auditQuery.isFetching && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[1180px] text-sm">
              <thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                  <th className="px-4 py-3 text-left font-semibold">Usuario</th>
                  <th className="px-4 py-3 text-left font-semibold">Accion</th>
                  <th className="px-4 py-3 text-left font-semibold">Modulo</th>
                  <th className="px-4 py-3 text-left font-semibold">Registro</th>
                  <th className="px-4 py-3 text-left font-semibold">IP</th>
                  <th className="px-4 py-3 text-left font-semibold">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-t bg-card align-top">
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {formatDateTime(entry.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{entry.usuario?.nombre ?? "Sistema"}</div>
                      <div className="text-xs text-muted-foreground">{entry.usuario?.correo ?? "Sin usuario"}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold">{entry.accion}</td>
                    <td className="px-4 py-3">
                      <div>{entry.modulo ?? "N/A"}</div>
                      <div className="text-xs text-muted-foreground">{entry.tabla ?? ""}</div>
                    </td>
                    <td className="px-4 py-3">{entry.registroId ?? "N/A"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{entry.ip ?? "N/A"}</td>
                    <td className="px-4 py-3">
                      <code className="block max-w-xl whitespace-pre-wrap rounded-md bg-muted/50 px-2 py-1 text-xs">
                        {truncateJson(entry.datosNuevos)}
                      </code>
                    </td>
                  </tr>
                ))}
                {!entries.length && (
                  <tr>
                    <td className="px-4 py-8 text-center text-muted-foreground" colSpan={7}>
                      No hay registros de auditoria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function truncateJson(value: unknown) {
  const text = JSON.stringify(value ?? {}, null, 2);
  return text.length > 700 ? `${text.slice(0, 700)}...` : text;
}
