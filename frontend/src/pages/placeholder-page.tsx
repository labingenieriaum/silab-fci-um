import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Modulo preparado</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          La estructura de rutas y layout ya esta lista para implementar este modulo en las siguientes fases.
        </CardContent>
      </Card>
    </div>
  );
}

