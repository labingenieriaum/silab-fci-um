import { FormEvent, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Hash,
  Loader2,
  Mail,
  PackageSearch,
  Search,
  User
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { apiRequest } from "@/lib/api";
import type { RolPersonaPrestamo } from "@/types/people";

interface PublicLoanResource {
  id: number;
  codigoInterno: string;
  nombre: string;
  cantidadDisponible: number;
  requiereSerial: boolean;
  categoria: {
    nombre: string;
  };
  ubicacion: {
    nombre: string;
    laboratorio: {
      codigo: string;
      nombre: string;
    };
  };
}

interface PublicLoanProgram {
  id: number;
  codigo: string;
  nombre: string;
  facultad: {
    sigla: string;
    nombre: string;
  };
}

interface PublicLoanRequestForm {
  nombreCompleto: string;
  correoInstitucional: string;
  rolSolicitante: RolPersonaPrestamo;
  identificacion: string;
  programa: string;
  semestre: string;
  materia: string;
  dependencia: string;
  equipoId: string;
  recursoSolicitado: string;
  cantidadSolicitada: string;
  fechaPrestamo: string;
  fechaDevolucionEstimada: string;
  descripcionActividad: string;
}

interface PublicLoanRequestResponse {
  codigoSolicitud: string;
  diasPrestamo: number;
  estado: string;
}

const emptyResources: PublicLoanResource[] = [];

const initialForm: PublicLoanRequestForm = {
  nombreCompleto: "",
  correoInstitucional: "",
  rolSolicitante: "ESTUDIANTE",
  identificacion: "",
  programa: "",
  semestre: "",
  materia: "",
  dependencia: "",
  equipoId: "",
  recursoSolicitado: "",
  cantidadSolicitada: "1",
  fechaPrestamo: todayDateValue(),
  fechaDevolucionEstimada: todayDateValue(),
  descripcionActividad: ""
};

const applicantRoleOptions = [
  { value: "ESTUDIANTE", label: "Estudiante", searchText: "estudiante" },
  { value: "PROFESOR", label: "Profesor", searchText: "profesor docente" },
  { value: "ADMINISTRATIVO", label: "Administrativo", searchText: "administrativo dependencia" }
];

function CircuitBackground() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden opacity-60">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,.14)_1px,transparent_0)] [background-size:26px_26px]" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice">
        <g stroke="rgba(155,201,92,.34)" strokeWidth="1.5" fill="none">
          <path d="M40 120 H180 V240 H320" />
          <path d="M500 80 V200 H400 V300" />
          <path d="M120 560 H260 V680" />
          <path d="M460 620 H540 V520 H420" />
        </g>
        <g fill="rgba(155,201,92,.75)">
          <circle cx="40" cy="120" r="4" />
          <circle cx="320" cy="240" r="4" />
          <circle cx="500" cy="80" r="4" />
          <circle cx="260" cy="680" r="4" />
          <circle cx="420" cy="520" r="4" />
        </g>
      </svg>
    </div>
  );
}

export function PublicLoanRequestPage() {
  const [form, setForm] = useState(initialForm);
  const [resourceSearch, setResourceSearch] = useState("");
  const [selectorOpen, setSelectorOpen] = useState(false);
  const [customResourceMode, setCustomResourceMode] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [success, setSuccess] = useState<PublicLoanRequestResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const resourcesQuery = useQuery({
    queryKey: ["public-loan-resources"],
    queryFn: () => apiRequest<PublicLoanResource[]>("/public/loan-resources")
  });

  const programsQuery = useQuery({
    queryKey: ["public-loan-programs"],
    queryFn: () => apiRequest<PublicLoanProgram[]>("/public/loan-programs")
  });

  const resources = resourcesQuery.data ?? emptyResources;
  const programs = programsQuery.data ?? [];
  const programOptions = programs.map((program) => ({
    value: program.nombre,
    label: program.nombre,
    description: `${program.codigo}${program.facultad ? ` - ${program.facultad.sigla}` : ""}`,
    searchText: `${program.codigo} ${program.nombre} ${program.facultad?.nombre ?? ""} ${program.facultad?.sigla ?? ""}`
  }));
  const selectedResource = resources.find((resource) => String(resource.id) === form.equipoId) ?? null;
  const filteredResources = useMemo(() => {
    const search = resourceSearch.trim().toLowerCase();
    if (!search) {
      return resources.slice(0, 12);
    }
    return resources
      .filter((resource) =>
        [
          resource.nombre,
          resource.codigoInterno,
          resource.categoria.nombre,
          resource.ubicacion.laboratorio.nombre,
          resource.ubicacion.laboratorio.codigo
        ]
          .join(" ")
          .toLowerCase()
          .includes(search)
      )
      .slice(0, 12);
  }, [resourceSearch, resources]);

  const loanDays = useMemo(
    () => calculateLoanDays(form.fechaPrestamo, form.fechaDevolucionEstimada),
    [form.fechaPrestamo, form.fechaDevolucionEstimada]
  );

  function updateForm<K extends keyof PublicLoanRequestForm>(key: K, value: PublicLoanRequestForm[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
      ...(key === "rolSolicitante"
        ? {
            identificacion: "",
            programa: "",
            semestre: "",
            materia: "",
            dependencia: ""
          }
        : {}),
      ...(key === "fechaPrestamo" && current.fechaDevolucionEstimada < value
        ? { fechaDevolucionEstimada: value }
        : {})
    }));
    setFeedback(null);
  }

  function selectResource(resource: PublicLoanResource) {
    setForm((current) => ({
      ...current,
      equipoId: String(resource.id),
      recursoSolicitado: "",
      cantidadSolicitada: resource.requiereSerial ? "1" : current.cantidadSolicitada
    }));
    setResourceSearch(resourceLabel(resource));
    setCustomResourceMode(false);
    setSelectorOpen(false);
    setFeedback(null);
  }

  function selectCustomResource() {
    setForm((current) => ({
      ...current,
      equipoId: "",
      recursoSolicitado: ""
    }));
    setResourceSearch("");
    setCustomResourceMode(true);
    setSelectorOpen(false);
    setFeedback(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setSuccess(null);

    if (!form.equipoId && form.recursoSolicitado.trim().length < 3) {
      setFeedback("Selecciona un equipo o describe el recurso que necesitas.");
      return;
    }
    if (form.rolSolicitante === "ESTUDIANTE") {
      if (!form.programa || !form.semestre) {
        setFeedback("Selecciona el programa/carrera y semestre del estudiante.");
        return;
      }
    }
    if (!form.identificacion.trim()) {
      setFeedback(
        form.rolSolicitante === "ESTUDIANTE"
          ? "Para estudiantes debes escribir el codigo estudiantil."
          : "Escribe la cedula del solicitante."
      );
      return;
    }
    if (form.rolSolicitante === "PROFESOR" && !form.materia.trim()) {
      setFeedback("Escribe la materia asociada al prestamo.");
      return;
    }
    if (form.rolSolicitante === "ADMINISTRATIVO" && !form.dependencia.trim()) {
      setFeedback("Escribe la dependencia administrativa.");
      return;
    }
    if (loanDays < 1) {
      setFeedback("La fecha de devolucion debe ser igual o posterior a la fecha de prestamo.");
      return;
    }
    if (!selectedResource?.requiereSerial && Number(form.cantidadSolicitada || 0) < 1) {
      setFeedback("Indica al menos una unidad solicitada.");
      return;
    }

    setLoading(true);
    try {
      const response = await apiRequest<PublicLoanRequestResponse>("/public/loan-requests", {
        method: "POST",
        body: JSON.stringify({
          nombreCompleto: form.nombreCompleto,
          correoInstitucional: form.correoInstitucional,
          rolSolicitante: form.rolSolicitante,
          identificacion: form.identificacion || undefined,
          programa: form.rolSolicitante === "ESTUDIANTE" ? form.programa : undefined,
          semestre: form.rolSolicitante === "ESTUDIANTE" && form.semestre ? Number(form.semestre) : undefined,
          materia: form.rolSolicitante === "PROFESOR" ? form.materia : undefined,
          dependencia: form.rolSolicitante === "ADMINISTRATIVO" ? form.dependencia : undefined,
          equipoId: form.equipoId ? Number(form.equipoId) : undefined,
          cantidadSolicitada: selectedResource?.requiereSerial ? 1 : Number(form.cantidadSolicitada || 1),
          codigo: form.equipoId ? selectedResource?.codigoInterno : form.recursoSolicitado,
          fechaPrestamo: form.fechaPrestamo,
          fechaDevolucionEstimada: form.fechaDevolucionEstimada,
          descripcionActividad: form.descripcionActividad
        })
      });
      setSuccess(response);
      setForm(initialForm);
      setResourceSearch("");
      setCustomResourceMode(false);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No fue posible registrar la solicitud.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[0.95fr_1.05fr]">
      <section className="relative overflow-hidden bg-[#0c3b22] px-6 py-8 text-white sm:px-10 lg:flex lg:flex-col lg:justify-between">
        <CircuitBackground />
        <div className="relative flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-xl bg-white p-1.5">
            <img src="/assets/logo-mark.png" alt="SILAB FCI" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="text-2xl font-extrabold leading-none">
              SILAB <span className="text-[#9bc95c]">FCI</span>
            </p>
            <p className="mt-1 text-xs text-[#cfe4d7]">Sistema de Inventario y Laboratorios</p>
          </div>
        </div>

        <div className="relative mt-12 max-w-lg lg:mt-0">
          <h1 className="text-4xl font-extrabold leading-tight tracking-normal">
            Solicitud publica de prestamo
          </h1>
          <p className="mt-4 text-sm leading-6 text-[#cfe4d7]">
            Facultad de Ciencias e Ingenieria - Universidad de Manizales.
          </p>
        </div>

        <div className="relative mt-10 flex items-center gap-2 text-xs text-[#82a892] lg:mt-0">
          <ClipboardList className="h-4 w-4" />
          La solicitud queda recibida para revision del equipo SILAB FCI.
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-8 sm:px-8">
        <form className="w-full max-w-2xl" onSubmit={handleSubmit}>
          <div className="mb-7">
            <p className="text-xs font-bold uppercase tracking-wide text-[#1c7344]">Prestamos</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-normal text-[#10201a]">
              Datos de la solicitud
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <PublicField label="Nombre completo" icon={<User className="h-4 w-4" />}>
              <input
                className="input-control pl-10"
                value={form.nombreCompleto}
                onChange={(event) => updateForm("nombreCompleto", event.target.value)}
                minLength={3}
                maxLength={120}
                required
              />
            </PublicField>

            <PublicField label="Correo institucional" icon={<Mail className="h-4 w-4" />}>
              <input
                className="input-control pl-10"
                type="email"
                value={form.correoInstitucional}
                onChange={(event) => updateForm("correoInstitucional", event.target.value)}
                placeholder="usuario@umanizales.edu.co"
                maxLength={160}
                required
              />
            </PublicField>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <PublicSelectField label="Tipo de solicitante">
              <SearchableSelect
                options={applicantRoleOptions}
                value={form.rolSolicitante}
                onChange={(value) => updateForm("rolSolicitante", value as RolPersonaPrestamo)}
                placeholder="Seleccionar"
                searchPlaceholder="Buscar tipo"
                emptyLabel="Seleccionar"
                required
              />
            </PublicSelectField>

            <PublicField
              label={form.rolSolicitante === "ESTUDIANTE" ? "Codigo estudiantil" : "Cedula"}
              icon={<Hash className="h-4 w-4" />}
            >
              <input
                className="input-control pl-10"
                value={form.identificacion}
                onChange={(event) => updateForm("identificacion", event.target.value)}
                placeholder={form.rolSolicitante === "ESTUDIANTE" ? "Ej. 822020114422" : "Ej. 1058..."}
                maxLength={40}
                required
              />
            </PublicField>
          </div>

          {form.rolSolicitante === "ESTUDIANTE" && (
            <div className="mt-3 rounded-md border border-[#dcefe3] bg-[#f4f8f1] p-4">
              <p className="text-xs leading-5 text-[#41524b]">
                Para estudiantes es obligatorio escribir el codigo estudiantil. No uses cedula ni tarjeta de identidad:
                el sistema validara la solicitud por codigo estudiantil y puede rechazarla si no corresponde.
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-[1fr_140px]">
                <PublicSelectField label="Programa / carrera">
                  <SearchableSelect
                    options={programOptions}
                    value={form.programa}
                    onChange={(value) => updateForm("programa", value)}
                    placeholder="Seleccionar programa"
                    searchPlaceholder="Buscar programa"
                    emptyLabel="Seleccionar"
                    required
                  />
                </PublicSelectField>
                <PublicField label="Semestre" icon={<Hash className="h-4 w-4" />}>
                  <input
                    className="input-control pl-10"
                    type="number"
                    min="1"
                    max="20"
                    value={form.semestre}
                    onChange={(event) => updateForm("semestre", event.target.value)}
                    required
                  />
                </PublicField>
              </div>
            </div>
          )}

          {form.rolSolicitante === "PROFESOR" && (
            <div className="mt-4">
              <PublicField label="Materia" icon={<ClipboardList className="h-4 w-4" />}>
                <input
                  className="input-control pl-10"
                  value={form.materia}
                  onChange={(event) => updateForm("materia", event.target.value)}
                  placeholder="Ej. Sistemas Operativos II"
                  maxLength={180}
                  required
                />
              </PublicField>
            </div>
          )}

          {form.rolSolicitante === "ADMINISTRATIVO" && (
            <div className="mt-4">
              <PublicField label="Dependencia" icon={<ClipboardList className="h-4 w-4" />}>
                <input
                  className="input-control pl-10"
                  value={form.dependencia}
                  onChange={(event) => updateForm("dependencia", event.target.value)}
                  placeholder="Ej. Laboratorios FCI, Decanatura, Soporte"
                  maxLength={180}
                  required
                />
              </PublicField>
            </div>
          )}

          <div className="mt-4">
            <label className="block text-sm font-medium">
              Equipo o infraestructura
              <span className="relative mt-2 block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="input-control pl-10"
                  value={selectorOpen ? resourceSearch : selectedResource ? resourceLabel(selectedResource) : resourceSearch}
                  onFocus={() => setSelectorOpen(true)}
                  onChange={(event) => {
                    setResourceSearch(event.target.value);
                    setSelectorOpen(true);
                    setForm((current) => ({ ...current, equipoId: "" }));
                    setCustomResourceMode(false);
                  }}
                  placeholder="Buscar por nombre del equipo"
                  autoComplete="off"
                />
                {selectorOpen && (
                  <div className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-md border bg-white p-1 shadow-lg">
                    {resourcesQuery.isLoading && (
                      <div className="flex items-center gap-2 px-3 py-3 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Cargando equipos disponibles...
                      </div>
                    )}
                    {!resourcesQuery.isLoading &&
                      filteredResources.map((resource) => (
                        <button
                          key={resource.id}
                          className="flex w-full items-start gap-3 rounded-sm px-3 py-2 text-left text-sm hover:bg-[#f4f8f1]"
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => selectResource(resource)}
                        >
                          <PackageSearch className="mt-0.5 h-4 w-4 shrink-0 text-[#155c37]" />
                          <span>
                            <span className="block font-semibold text-[#10201a]">{resource.nombre}</span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {resource.codigoInterno} · {resource.categoria.nombre} · {resource.cantidadDisponible} disponibles
                            </span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {resource.ubicacion.laboratorio.codigo} - {resource.ubicacion.laboratorio.nombre}
                            </span>
                          </span>
                        </button>
                      ))}
                    {!resourcesQuery.isLoading && !filteredResources.length && (
                      <div className="px-3 py-3 text-sm text-muted-foreground">
                        No hay coincidencias con la busqueda.
                      </div>
                    )}
                    <button
                      className="mt-1 flex w-full items-start gap-3 rounded-sm border border-dashed border-[#b2cf73] bg-[#f4f8f1] px-3 py-2 text-left text-sm hover:bg-[#eaf3df]"
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={selectCustomResource}
                    >
                      <Hash className="mt-0.5 h-4 w-4 shrink-0 text-[#155c37]" />
                      <span>
                        <span className="block font-semibold text-[#155c37]">
                          El equipo o infraestructura no esta en la lista
                        </span>
                        <span className="text-xs text-[#41524b]">
                          Escribir una solicitud especial para revision de coordinacion.
                        </span>
                      </span>
                    </button>
                  </div>
                )}
              </span>
            </label>
          </div>

          {customResourceMode && (
            <div className="mt-3 rounded-md border border-[#b2cf73] bg-[#f4f8f1] p-4">
              <label className="block text-sm font-medium text-[#10201a]">
                Describe que necesitas
                <textarea
                  className="textarea-control mt-2 min-h-24 bg-white"
                  value={form.recursoSolicitado}
                  onChange={(event) => updateForm("recursoSolicitado", event.target.value)}
                  placeholder="Ej. Necesito un kit de sensores para practica de IoT, no conozco el nombre exacto."
                  minLength={3}
                  maxLength={180}
                  required
                />
              </label>
              <p className="mt-2 text-xs leading-5 text-[#41524b]">
                Coordinacion revisara si el recurso existe con otro nombre, si aplica como prestamo especial o si debe rechazarse con una nota explicando el motivo.
              </p>
            </div>
          )}

          <div className="mt-4 max-w-xs">
            <PublicField label="Cantidad solicitada" icon={<Hash className="h-4 w-4" />}>
              <input
                className="input-control pl-10"
                type="number"
                min="1"
                max={selectedResource?.cantidadDisponible}
                value={selectedResource?.requiereSerial ? "1" : form.cantidadSolicitada}
                onChange={(event) => updateForm("cantidadSolicitada", event.target.value)}
                disabled={Boolean(selectedResource?.requiereSerial)}
                required
              />
            </PublicField>
            {selectedResource?.requiereSerial && (
              <p className="mt-1 text-xs text-muted-foreground">
                Los equipos con serial se solicitan por unidad.
              </p>
            )}
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_150px]">
            <PublicField label="Fecha de prestamo" icon={<CalendarDays className="h-4 w-4" />}>
              <input
                className="input-control pl-10"
                type="date"
                min={todayDateValue()}
                value={form.fechaPrestamo}
                onChange={(event) => updateForm("fechaPrestamo", event.target.value)}
                required
              />
            </PublicField>

            <PublicField label="Fecha de devolucion" icon={<CalendarDays className="h-4 w-4" />}>
              <input
                className="input-control pl-10"
                type="date"
                min={form.fechaPrestamo || todayDateValue()}
                value={form.fechaDevolucionEstimada}
                onChange={(event) => updateForm("fechaDevolucionEstimada", event.target.value)}
                required
              />
            </PublicField>

            <div className="rounded-md border border-[#dcefe3] bg-[#f4f8f1] px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-[#5d8a4a]">Duracion</p>
              <p className="mt-1 text-2xl font-extrabold text-[#155c37]">{loanDays}</p>
              <p className="text-xs text-[#41524b]">{loanDays === 1 ? "dia" : "dias"}</p>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium">
              Descripcion de la actividad
              <textarea
                className="textarea-control mt-2 min-h-32"
                value={form.descripcionActividad}
                onChange={(event) => updateForm("descripcionActividad", event.target.value)}
                minLength={10}
                maxLength={1200}
                required
              />
            </label>
          </div>

          {feedback && (
            <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {feedback}
            </div>
          )}

          {success && (
            <div className="mt-4 rounded-md border border-[#b2cf73] bg-[#f4f8f1] px-4 py-3 text-sm text-[#155c37]">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4" />
                Solicitud recibida
              </div>
              <p className="mt-1">
                Codigo: <span className="font-mono font-bold">{success.codigoSolicitud}</span>
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Link className="text-sm font-medium text-[#155c37] hover:underline" to="/login">
              Ingresar como funcionario
            </Link>
            <Button className="sm:w-56" type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Enviar solicitud
            </Button>
          </div>
        </form>
      </section>
    </main>
  );
}

function PublicField({
  label,
  icon,
  children
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <span className="relative mt-2 block">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        {children}
      </span>
    </label>
  );
}

function PublicSelectField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium">
      {label}
      <span className="mt-2 block">{children}</span>
    </label>
  );
}

function resourceLabel(resource: PublicLoanResource) {
  return `${resource.nombre} (${resource.codigoInterno})`;
}

function calculateLoanDays(startValue: string, endValue: string) {
  if (!startValue || !endValue) {
    return 0;
  }
  const start = new Date(`${startValue}T00:00:00`);
  const end = new Date(`${endValue}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 0;
  }
  return Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
}

function todayDateValue() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}
