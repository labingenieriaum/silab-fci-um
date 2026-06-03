import { Activity, AlertTriangle, Boxes, ClipboardCheck } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const summary = [
  { label: "Equipos registrados", value: "0", icon: Boxes },
  { label: "Prestamos activos", value: "0", icon: ClipboardCheck },
  { label: "Solicitudes pendientes", value: "0", icon: Activity },
  { label: "Alertas operativas", value: "0", icon: AlertTriangle }
];

const usageData = [
  { name: "Lab 1", prestamos: 0 },
  { name: "Lab 2", prestamos: 0 },
  { name: "Lab 3", prestamos: 0 }
];

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Indicadores iniciales para la coordinacion de laboratorios.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => (
          <Card key={item.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.label}
              </CardTitle>
              <item.icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Uso por laboratorio</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={usageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="prestamos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado de fase 1</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Backend NestJS y Prisma configurados.</p>
            <p>Frontend React, Vite, TailwindCSS y Shadcn UI base configurados.</p>
            <p>El siguiente paso es autenticacion y usuarios.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

