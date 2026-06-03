import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { useAuth } from "@/features/auth/auth-context";
import { apiRequest } from "@/lib/api";
import type { Facultad } from "@/types/catalogs";

interface FacultyFormState {
  nombre: string;
  sigla: string;
}

const initialForm: FacultyFormState = {
  nombre: "",
  sigla: ""
};

export function FacultiesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [form, setForm] = useState<FacultyFormState>(initialForm);
  const [feedback, setFeedback] = useState<string | null>(null);

  const facultiesQuery = useQuery({
    queryKey: ["faculties"],
    queryFn: () => apiRequest<Facultad[]>("/faculties")
  });

  const createMutation = useMutation({
    mutationFn: (payload: FacultyFormState) =>
      apiRequest<Facultad>("/faculties", {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    onSuccess: async () => {
      setFeedback("Facultad creada correctamente.");
      setForm(initialForm);
      await queryClient.invalidateQueries({ queryKey: ["faculties"] });
    },
    onError: (error) =>
      setFeedback(error instanceof Error ? error.message : "No fue posible crear la facultad.")
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest<Facultad>(`/faculties/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["faculties"] });
    }
  });

  const faculties = facultiesQuery.data ?? [];
  const isGlobalAdmin = user?.tipoUsuario === "ADMINISTRADOR" && !user.facultad;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    createMutation.mutate(form);
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal">Facultades</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alcance institucional del sistema. Actualmente se opera con FCI.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Facultades visibles</CardTitle>
            {facultiesQuery.isFetching && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[680px] text-sm">
                <thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Facultad</th>
                    <th className="px-4 py-3 text-right font-semibold">Programas</th>
                    <th className="px-4 py-3 text-right font-semibold">Laboratorios</th>
                    <th className="px-4 py-3 text-right font-semibold">Usuarios</th>
                    <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {faculties.map((faculty) => {
                    const totalRelations =
                      (faculty._count?.programas ?? 0) +
                      (faculty._count?.laboratorios ?? 0) +
                      (faculty._count?.usuarios ?? 0);
                    return (
                      <tr key={faculty.id} className="border-t bg-white">
                        <td className="px-4 py-3">
                          <div className="font-medium">{faculty.nombre}</div>
                          <div className="text-xs text-muted-foreground">{faculty.sigla}</div>
                        </td>
                        <td className="px-4 py-3 text-right">{faculty._count?.programas ?? 0}</td>
                        <td className="px-4 py-3 text-right">{faculty._count?.laboratorios ?? 0}</td>
                        <td className="px-4 py-3 text-right">{faculty._count?.usuarios ?? 0}</td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Eliminar facultad"
                            disabled={!isGlobalAdmin || deleteMutation.isPending || totalRelations > 0}
                            onClick={() => deleteMutation.mutate(faculty.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {!faculties.length && (
                    <tr>
                      <td className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>
                        No hay facultades visibles para tu usuario.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              Nueva facultad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Field label="Nombre">
                <input
                  className="input-control"
                  value={form.nombre}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, nombre: event.target.value }))
                  }
                  disabled={!isGlobalAdmin}
                  required
                />
              </Field>
              <Field label="Sigla">
                <input
                  className="input-control"
                  value={form.sigla}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, sigla: event.target.value }))
                  }
                  disabled={!isGlobalAdmin}
                  required
                />
              </Field>
              {!isGlobalAdmin && (
                <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                  Tu usuario trabaja dentro de una facultad asignada. La creacion de nuevas facultades queda reservada al administrador global.
                </div>
              )}
              {feedback && (
                <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                  {feedback}
                </div>
              )}
              <Button className="w-full" type="submit" disabled={!isGlobalAdmin || createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Crear facultad
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
