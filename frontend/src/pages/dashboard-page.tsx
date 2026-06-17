import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, BarChart3, CalendarClock, Mail, PackageCheck, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/api";
import { formatDateTime, formatEnum } from "@/lib/format";
import type { EstadoPrestamo } from "@/types/loans";

interface DashboardData {
  summary: {
    totalLoans: number;
    activeLoans: number;
    dueSoon: number;
    overdueLoans: number;
  };
  equipmentLoaned: Array<{
    name: string;
    codigo: string;
    loaned: number;
    loans: number;
  }>;
  programsByLoans: Array<{
    name: string;
    loans: number;
  }>;
  semestersByLoans: Array<{
    semester: string;
    loans: number;
  }>;
  dueSoon: Array<{
    id: number;
    codigo: string;
    requesterName: string;
    requesterEmail: string;
    resource: string;
    program: string;
    semester: string;
    dueDate: string;
    state: EstadoPrestamo;
  }>;
}

export function DashboardPage() {
  const queryClient = useQueryClient();
  const dashboardQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiRequest<DashboardData>("/dashboard")
  });
  const reminderMutation = useMutation({
    mutationFn: (loanId: number) =>
      apiRequest<{ sent: boolean; to: string }>(`/loans/${loanId}/due-soon-email`, {
        method: "POST"
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    }
  });

  const data = dashboardQuery.data;
  const summary = [
    { label: "Prestamos registrados", value: data?.summary.totalLoans ?? 0, icon: BarChart3 },
    { label: "Prestamos activos", value: data?.summary.activeLoans ?? 0, icon: PackageCheck },
    { label: "Por vencerse", value: data?.summary.dueSoon ?? 0, icon: CalendarClock },
    { label: "Vencidos", value: data?.summary.overdueLoans ?? 0, icon: AlertTriangle }
  ];

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Seguimiento de prestamos, equipos entregados y fechas proximas de devolucion.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => (
          <Card key={item.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
              <item.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      {dashboardQuery.isError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {dashboardQuery.error instanceof Error
            ? dashboardQuery.error.message
            : "No fue posible cargar el dashboard."}
        </div>
      )}

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Equipos prestados</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.equipmentLoaned ?? []} margin={{ left: 0, right: 12, top: 8, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="codigo"
                  tickLine={false}
                  axisLine={false}
                  angle={-25}
                  textAnchor="end"
                  interval={0}
                  height={58}
                />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value, name) => [value, name === "loaned" ? "Unidades prestadas" : name]}
                  labelFormatter={(label) => {
                    const item = data?.equipmentLoaned.find((equipment) => equipment.codigo === label);
                    return item ? `${item.codigo} - ${item.name}` : label;
                  }}
                />
                <Bar dataKey="loaned" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Semestres con mas prestamos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.semestersByLoans ?? []).slice(0, 10).map((semester, index) => (
              <RankRow key={semester.semester} index={index + 1} label={semester.semester} value={semester.loans} />
            ))}
            {!data?.semestersByLoans.length && <EmptyText text="Sin prestamos por semestre." />}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Programas con mas prestamos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data?.programsByLoans ?? []).map((program, index) => (
              <RankRow key={program.name} index={index + 1} label={program.name} value={program.loans} />
            ))}
            {!data?.programsByLoans.length && <EmptyText text="Sin prestamos por programa." />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle>Prestamos por vencerse</CardTitle>
            <span className="text-sm text-muted-foreground">15 fechas mas proximas</span>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Fecha</th>
                    <th className="px-3 py-2 text-left">Prestamo</th>
                    <th className="px-3 py-2 text-left">Persona</th>
                    <th className="px-3 py-2 text-left">Recurso</th>
                    <th className="px-3 py-2 text-left">Contexto</th>
                    <th className="px-3 py-2 text-right">Accion</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.dueSoon ?? []).map((loan) => (
                    <tr key={loan.id} className="border-t">
                      <td className="px-3 py-3 font-medium">{formatDateTime(loan.dueDate)}</td>
                      <td className="px-3 py-3">
                        <div className="font-medium">{loan.codigo}</div>
                        <span className={badgeClass(loan.state)}>{formatEnum(loan.state)}</span>
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-medium">{loan.requesterName}</div>
                        <div className="text-xs text-muted-foreground">{loan.requesterEmail || "Sin correo"}</div>
                      </td>
                      <td className="px-3 py-3">{loan.resource}</td>
                      <td className="px-3 py-3">
                        <div>{loan.program}</div>
                        <div className="text-xs text-muted-foreground">{loan.semester}</div>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => reminderMutation.mutate(loan.id)}
                          disabled={reminderMutation.isPending || !loan.requesterEmail}
                        >
                          <Mail className="h-4 w-4" />
                          Recordatorio
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!data?.dueSoon.length && (
                    <tr>
                      <td className="px-3 py-8 text-center text-muted-foreground" colSpan={6}>
                        No hay prestamos proximos a vencer.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {reminderMutation.isError && (
              <p className="mt-3 rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                {reminderMutation.error instanceof Error
                  ? reminderMutation.error.message
                  : "No fue posible enviar el recordatorio."}
              </p>
            )}
            {reminderMutation.isSuccess && (
              <p className="mt-3 rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary">
                Recordatorio enviado o registrado segun la configuracion SMTP.
              </p>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function RankRow({ index, label, value }: { index: number; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-white px-3 py-2">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-xs font-semibold text-primary">
          {index}
        </span>
        <span className="min-w-0 truncate font-medium">{label}</span>
      </div>
      <span className="flex shrink-0 items-center gap-1 text-sm font-semibold">
        <Users className="h-4 w-4 text-primary" />
        {value}
      </span>
    </div>
  );
}

function EmptyText({ text }: { text: string }) {
  return <p className="rounded-md border bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">{text}</p>;
}

function badgeClass(state: EstadoPrestamo) {
  if (state === "VENCIDO") {
    return "mt-1 inline-flex rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700";
  }
  return "mt-1 inline-flex rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700";
}
