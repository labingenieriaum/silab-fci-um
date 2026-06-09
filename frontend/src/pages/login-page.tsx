import { FormEvent, useState } from "react";
import { ArrowRight, Building2, Lock, Mail } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/auth-context";
import { Button } from "@/components/ui/button";

function CircuitBackground() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden opacity-60">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,.14)_1px,transparent_0)] [background-size:26px_26px]" />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 600 800"
        preserveAspectRatio="xMidYMid slice"
      >
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

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? "/";

  if (user) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(correo, password);
      navigate(from, { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "No fue posible iniciar sesion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-[#0c3b22] px-11 py-10 text-white lg:flex lg:flex-col lg:justify-between">
        <CircuitBackground />
        <div className="relative flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-white p-1.5">
            <img src="/assets/logo-mark.png" alt="SILAB FCI" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="text-xl font-extrabold leading-none">
              SILAB <span className="text-[#9bc95c]">FCI</span>
            </p>
            <p className="mt-1 text-xs text-[#cfe4d7]">Sistema de Información de Infraestructura y Laboratorios</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-4xl font-extrabold leading-tight tracking-normal">
            Gestion integral de equipos y laboratorios
          </h1>
          <p className="mt-4 text-sm leading-6 text-[#cfe4d7]">
            Inventario, prestamos, devoluciones, mantenimientos y reportes de la Facultad de Ciencias e Ingenieria en una sola plataforma.
          </p>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-[#82a892]">
          <Building2 className="h-4 w-4" />
          Facultad de Ciencias e Ingenieria - Universidad de Manizales
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-white px-6 py-10">
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <div className="mb-8 flex justify-center lg:hidden">
            <img src="/assets/logo-full.png" alt="SILAB FCI" className="h-16 object-contain" />
          </div>

          <h2 className="text-2xl font-extrabold tracking-normal">Iniciar sesion</h2>
          <p className="mt-2 text-sm text-muted-foreground">Ingresa con tu correo institucional.</p>

          <div className="mt-7 space-y-4">
            <label className="block text-sm font-medium">
              Correo institucional
              <span className="relative mt-2 block">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="h-10 w-full rounded-md border border-input bg-white pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  value={correo}
                  onChange={(event) => setCorreo(event.target.value)}
                  placeholder="usuario@umanizales.edu.co"
                  autoComplete="email"
                />
              </span>
            </label>

            <label className="block text-sm font-medium">
              Contrasena
              <span className="relative mt-2 block">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="h-10 w-full rounded-md border border-input bg-white pl-10 pr-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Contrasena"
                  autoComplete="current-password"
                />
              </span>
            </label>
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button className="mt-6 w-full" type="submit" disabled={loading}>
            {loading ? "Verificando..." : "Iniciar sesion"}
            <ArrowRight className="h-4 w-4" />
          </Button>

          <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
            Al ingresar aceptas las politicas de uso de laboratorios. Si tienes problemas de acceso, contacta a Coordinacion de Laboratorios.
          </p>

          <div className="mt-5 text-center text-sm">
            <Link className="font-medium text-[#155c37] hover:underline" to="/solicitar-prestamo">
              Solicitar prestamo sin iniciar sesion
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
