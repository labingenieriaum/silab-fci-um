import { FormEvent, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers3, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { apiRequest } from "@/lib/api";
import type { EquipmentCategory } from "@/types/inventory";

interface CategoryFormState {
  nombre: string;
  descripcion: string;
}

const initialForm: CategoryFormState = {
  nombre: "",
  descripcion: ""
};

export function CategoriesPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CategoryFormState>(initialForm);
  const [feedback, setFeedback] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ["equipment-categories"],
    queryFn: () => apiRequest<EquipmentCategory[]>("/equipment-categories")
  });

  const createMutation = useMutation({
    mutationFn: (payload: CategoryFormState) =>
      apiRequest<EquipmentCategory>("/equipment-categories", {
        method: "POST",
        body: JSON.stringify({
          nombre: payload.nombre,
          descripcion: payload.descripcion || undefined
        })
      }),
    onSuccess: async () => {
      setFeedback("Categoria creada correctamente.");
      setForm(initialForm);
      await queryClient.invalidateQueries({ queryKey: ["equipment-categories"] });
    },
    onError: (error) => setFeedback(error instanceof Error ? error.message : "No fue posible crear la categoria.")
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest<EquipmentCategory>(`/equipment-categories/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["equipment-categories"] });
    }
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    createMutation.mutate(form);
  }

  const categories = categoriesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-normal">Categorias</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Clasificacion real de equipos usada por el inventario.
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Categorias registradas</CardTitle>
            {categoriesQuery.isFetching && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Categoria</th>
                    <th className="px-4 py-3 text-left font-semibold">Descripcion</th>
                    <th className="px-4 py-3 text-right font-semibold">Equipos</th>
                    <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id} className="border-t bg-white">
                      <td className="px-4 py-3 font-medium">{category.nombre}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {category.descripcion || "Sin descripcion"}
                      </td>
                      <td className="px-4 py-3 text-right">{category._count.equipos}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Eliminar categoria"
                          disabled={deleteMutation.isPending || category._count.equipos > 0}
                          onClick={() => deleteMutation.mutate(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!categories.length && (
                    <tr>
                      <td className="px-4 py-8 text-center text-muted-foreground" colSpan={4}>
                        No hay categorias registradas.
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
              <Layers3 className="h-4 w-4 text-primary" />
              Nueva categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Field label="Nombre">
                <input
                  className="input-control"
                  value={form.nombre}
                  onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
                  required
                />
              </Field>
              <Field label="Descripcion">
                <textarea
                  className="textarea-control"
                  value={form.descripcion}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, descripcion: event.target.value }))
                  }
                />
              </Field>
              {feedback && (
                <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                  {feedback}
                </div>
              )}
              <Button className="w-full" type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Crear categoria
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
