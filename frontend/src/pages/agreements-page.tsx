import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { apiRequest } from "@/lib/api";
import type { Agreement, PaginatedResponse } from "@/types/inventory";

interface AgreementFormState {
  nombre: string;
  identificacion: string;
  correo: string;
  telefono: string;
  contacto: string;
  observaciones: string;
  documentoNombre: string;
  documentoMimeType: string;
  documentoBase64: string;
  activo: boolean;
}

const initialForm: AgreementFormState = {
  nombre: "",
  identificacion: "",
  correo: "",
  telefono: "",
  contacto: "",
  observaciones: "",
  documentoNombre: "",
  documentoMimeType: "",
  documentoBase64: "",
  activo: true
};

export function AgreementsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState<Agreement | null>(null);
  const [form, setForm] = useState<AgreementFormState>(initialForm);
  const [feedback, setFeedback] = useState<string | null>(null);

  const agreementsQuery = useQuery({
    queryKey: ["agreements", search],
    queryFn: () =>
      apiRequest<PaginatedResponse<Agreement>>(
        `/agreements?page=1&pageSize=100${search ? `&search=${encodeURIComponent(search)}` : ""}`
      )
  });

  const saveMutation = useMutation({
    mutationFn: ({ id, payload }: { id?: number; payload: AgreementFormState }) =>
      apiRequest<Agreement>(id ? `/agreements/${id}` : "/agreements", {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify({
          nombre: payload.nombre,
          identificacion: payload.identificacion || null,
          correo: payload.correo || null,
          telefono: payload.telefono || null,
          contacto: payload.contacto || null,
          observaciones: payload.observaciones || null,
          documentoNombre: payload.documentoNombre || null,
          documentoMimeType: payload.documentoMimeType || null,
          documentoBase64: payload.documentoBase64 || null,
          activo: payload.activo
        })
      }),
    onSuccess: async () => {
      setFeedback(editingAgreement ? "Convenio actualizado." : "Convenio registrado.");
      closeModal();
      await queryClient.invalidateQueries({ queryKey: ["agreements"] });
    },
    onError: (error) => setFeedback(error instanceof Error ? error.message : "No fue posible guardar el convenio.")
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest<Agreement>(`/agreements/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      setFeedback("Convenio eliminado o desactivado segun sus equipos asociados.");
      await queryClient.invalidateQueries({ queryKey: ["agreements"] });
    },
    onError: (error) => setFeedback(error instanceof Error ? error.message : "No fue posible eliminar el convenio.")
  });

  const agreements = useMemo(() => agreementsQuery.data?.data ?? [], [agreementsQuery.data]);

  function updateForm<K extends keyof AgreementFormState>(key: K, value: AgreementFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function openCreateModal() {
    setEditingAgreement(null);
    setForm(initialForm);
    setModalOpen(true);
  }

  function openEditModal(agreement: Agreement) {
    setEditingAgreement(agreement);
    setForm({
      nombre: agreement.nombre,
      identificacion: agreement.identificacion ?? "",
      correo: agreement.correo ?? "",
      telefono: agreement.telefono ?? "",
      contacto: agreement.contacto ?? "",
      observaciones: agreement.observaciones ?? "",
      documentoNombre: agreement.documentoNombre ?? "",
      documentoMimeType: agreement.documentoMimeType ?? "",
      documentoBase64: agreement.documentoBase64 ?? "",
      activo: agreement.activo
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingAgreement(null);
    setForm(initialForm);
  }

  async function handleDocumentUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.type !== "application/pdf") {
      setFeedback("El documento del convenio debe ser PDF.");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setForm((current) => ({
      ...current,
      documentoNombre: file.name,
      documentoMimeType: file.type,
      documentoBase64: dataUrl
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    if (!form.nombre.trim()) {
      setFeedback("El nombre del convenio es obligatorio.");
      return;
    }
    saveMutation.mutate({ id: editingAgreement?.id, payload: form });
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Convenios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registra entidades o personas que prestan equipos a la facultad.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              className="input-control w-72 pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar convenio"
            />
          </div>
          <Button type="button" onClick={openCreateModal}>
            <Plus className="h-4 w-4" />
            Nuevo convenio
          </Button>
        </div>
      </section>

      {feedback && <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">{feedback}</div>}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Convenios registrados</CardTitle>
          {agreementsQuery.isFetching && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Convenio</th>
                  <th className="px-4 py-3 text-left font-semibold">Contacto</th>
                  <th className="px-4 py-3 text-left font-semibold">Documento</th>
                  <th className="px-4 py-3 text-right font-semibold">Equipos</th>
                  <th className="px-4 py-3 text-left font-semibold">Estado</th>
                  <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {agreements.map((agreement) => (
                  <tr key={agreement.id} className="border-t bg-card">
                    <td className="px-4 py-3">
                      <div className="font-medium">{agreement.nombre}</div>
                      <div className="text-xs text-muted-foreground">{agreement.identificacion ?? "Sin cedula/NIT"}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      <div>{agreement.contacto ?? "Sin contacto"}</div>
                      <div>{[agreement.correo, agreement.telefono].filter(Boolean).join(" | ") || "Sin correo/telefono"}</div>
                    </td>
                    <td className="px-4 py-3">
                      {agreement.documentoNombre ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs">
                          <FileText className="h-3 w-3" />
                          {agreement.documentoNombre}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Sin PDF</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">{agreement._count?.equipos ?? 0}</td>
                    <td className="px-4 py-3">{agreement.activo ? "Activo" : "Inactivo"}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button type="button" size="icon" variant="ghost" onClick={() => openEditModal(agreement)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate(agreement.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!agreements.length && (
                  <tr>
                    <td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>
                      No hay convenios registrados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg border bg-card shadow-xl">
            <form onSubmit={handleSubmit}>
              <div className="flex items-center justify-between border-b px-5 py-4">
                <h2 className="text-lg font-semibold">{editingAgreement ? "Editar convenio" : "Registrar convenio"}</h2>
                <Button type="button" variant="ghost" size="icon" onClick={closeModal}>x</Button>
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <Field label="Nombre de persona o entidad">
                  <input className="input-control" value={form.nombre} onChange={(event) => updateForm("nombre", event.target.value)} required />
                </Field>
                <Field label="Cedula o NIT">
                  <input className="input-control" value={form.identificacion} onChange={(event) => updateForm("identificacion", event.target.value)} />
                </Field>
                <Field label="Correo de contacto">
                  <input className="input-control" type="email" value={form.correo} onChange={(event) => updateForm("correo", event.target.value)} />
                </Field>
                <Field label="Telefono de contacto">
                  <input className="input-control" value={form.telefono} onChange={(event) => updateForm("telefono", event.target.value)} />
                </Field>
                <Field label="Responsable o contacto">
                  <input className="input-control" value={form.contacto} onChange={(event) => updateForm("contacto", event.target.value)} />
                </Field>
                <Field label="Documento del convenio (PDF)">
                  <input className="input-control" type="file" accept="application/pdf,.pdf" onChange={handleDocumentUpload} />
                  {form.documentoNombre && <p className="mt-1 text-xs text-muted-foreground">Archivo cargado: {form.documentoNombre}</p>}
                </Field>
                <Field label="Observaciones">
                  <textarea className="textarea-control" value={form.observaciones} onChange={(event) => updateForm("observaciones", event.target.value)} />
                </Field>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={form.activo} onChange={(event) => updateForm("activo", event.target.checked)} />
                  Convenio activo
                </label>
              </div>
              <div className="flex justify-end gap-2 border-t px-5 py-4">
                <Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Guardar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("No fue posible leer el archivo."));
    reader.readAsDataURL(file);
  });
}
