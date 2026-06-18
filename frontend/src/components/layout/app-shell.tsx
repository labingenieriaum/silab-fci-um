import {
  Activity,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  Boxes,
  CalendarCheck,
  ChevronRight,
  ClipboardCheck,
  Contact,
  FileText,
  FlaskConical,
  Home,
  KeyRound,
  Layers3,
  LogOut,
  MapPin,
  Menu,
  Moon,
  Package,
  RotateCcw,
  Settings,
  Shield,
  Sun,
  Users,
  Wrench,
  X
} from "lucide-react";
import type { ComponentType } from "react";
import { FormEvent, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/auth-context";
import { apiRequest } from "@/lib/api";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  permission?: string;
  permissions?: string[];
}

const navGroups = [
  {
    label: "Principal",
    items: [{ label: "Dashboard", href: "/", icon: Home }]
  },
  {
    label: "Operacion",
    items: [
      {
        label: "Prestamos",
        href: "/loans",
        icon: CalendarCheck,
        permissions: ["prestamos:solicitar", "prestamos:aprobar", "prestamos:entregar"]
      },
      { label: "Devoluciones", href: "/returns", icon: RotateCcw, permission: "devoluciones:registrar" },
      { label: "Mantenimientos", href: "/maintenance", icon: Wrench, permission: "mantenimiento:gestionar" }
    ]
  },
  {
    label: "Catalogo",
    items: [
      { label: "Inventario", href: "/inventory", icon: Boxes, permission: "inventario:gestionar" },
      { label: "Equipos", href: "/equipment", icon: Package, permission: "inventario:gestionar" },
      { label: "Convenios", href: "/agreements", icon: FileText, permission: "inventario:gestionar" },
      { label: "Categorias", href: "/categories", icon: Layers3, permission: "inventario:gestionar" },
      { label: "Laboratorios", href: "/labs", icon: FlaskConical, permission: "laboratorios:gestionar" },
      { label: "Ubicaciones", href: "/locations", icon: MapPin, permission: "laboratorios:gestionar" }
    ]
  },
  {
    label: "Academico",
    items: [
      { label: "Facultades", href: "/faculties", icon: Building2, permission: "academia:gestionar" },
      { label: "Programas", href: "/programs", icon: BookOpen },
      { label: "Materias", href: "/subjects", icon: BookOpen },
      { label: "Semilleros", href: "/seedbeds", icon: FlaskConical },
      { label: "Proyectos", href: "/projects", icon: ClipboardCheck },
      { label: "Actividades", href: "/activities", icon: Activity }
    ]
  },
  {
    label: "Administracion",
    items: [
      { label: "Usuarios", href: "/users", icon: Users, permission: "usuarios:gestionar" },
      { label: "Personas", href: "/people", icon: Contact, permission: "usuarios:gestionar" },
      { label: "Reportes", href: "/reports", icon: FileText, permission: "reportes:ver" },
      { label: "Auditoria", href: "/audit", icon: Shield, permission: "auditoria:ver" },
      { label: "Configuracion", href: "/settings", icon: Settings, permission: "usuarios:gestionar" }
    ]
  }
] satisfies Array<{ label: string; items: NavItem[] }>;

const mobileNav = [
  { label: "Inicio", href: "/", icon: Home },
  {
    label: "Prestamos",
    href: "/loans",
    icon: CalendarCheck,
    permissions: ["prestamos:solicitar", "prestamos:aprobar", "prestamos:entregar"]
  },
  { label: "Inventario", href: "/inventory", icon: Boxes, permission: "inventario:gestionar" },
  { label: "Usuarios", href: "/users", icon: Users, permission: "usuarios:gestionar" },
  { label: "Reportes", href: "/reports", icon: BarChart3, permission: "reportes:ver" }
] satisfies NavItem[];

export function AppShell() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("silab-theme") === "dark");
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordFeedback, setPasswordFeedback] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("silab-theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const passwordMutation = useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      apiRequest<{ status: string }>("/auth/change-password", {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      setPasswordFeedback("Contrasena actualizada correctamente.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => {
        setPasswordOpen(false);
        setPasswordFeedback(null);
      }, 900);
    },
    onError: (error) =>
      setPasswordFeedback(error instanceof Error ? error.message : "No fue posible cambiar la contrasena.")
  });

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordFeedback(null);
    if (passwordForm.newPassword.length < 8) {
      setPasswordFeedback("La nueva contrasena debe tener al menos 8 caracteres.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordFeedback("La confirmacion no coincide con la nueva contrasena.");
      return;
    }
    passwordMutation.mutate({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword
    });
  }

  const initials =
    user?.nombre
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "SF";

  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => canSeeNavItem(item, hasPermission))
    }))
    .filter((group) => group.items.length > 0);

  const visibleMobileNav = mobileNav.filter((item) => canSeeNavItem(item, hasPermission));

  return (
    <div className="min-h-screen bg-background">
      {mobileOpen && (
        <button
          aria-label="Cerrar menu"
          className="fixed inset-0 z-30 bg-black/45 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 -translate-x-full flex-col bg-[#0c3b22] text-[#cfe4d7] transition-transform md:translate-x-0",
          mobileOpen && "translate-x-0"
        )}
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-white p-1.5">
            <img src="/assets/logo-mark.png" alt="SILAB FCI" className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-extrabold leading-none text-white">
              SILAB <span className="text-[#9bc95c]">FCI</span>
            </p>
            <p className="mt-1 truncate text-[11px] text-[#82a892]">Infraestructura y Laboratorios</p>
          </div>
          <button
            aria-label="Cerrar menu"
            className="ml-auto rounded-md p-1 text-white md:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {visibleGroups.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#82a892]">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <NavLink
                    key={item.href}
                    to={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "relative flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors hover:bg-white/10 hover:text-white",
                        isActive ? "bg-[#155c37] text-white" : "text-[#cfe4d7]"
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 h-5 w-1 rounded-r bg-[#7fb539]" />
                        )}
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex min-w-0 items-center gap-2">
            <span className="hidden text-xs font-medium text-muted-foreground sm:inline">SILAB</span>
            <ChevronRight className="hidden h-3 w-3 text-muted-foreground sm:inline" />
            <span className="truncate text-sm font-semibold">Plataforma institucional</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Notificaciones">
              <Bell className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Tema"
              onClick={() => setDarkMode((current) => !current)}
              title={darkMode ? "Modo claro" : "Modo oscuro"}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Cambiar contrasena"
              title="Cambiar contrasena"
              onClick={() => setPasswordOpen(true)}
            >
              <KeyRound className="h-4 w-4" />
            </Button>

            <div className="hidden items-center gap-2 rounded-md px-2 py-1.5 sm:flex">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-[#155c37] to-[#7fb539] text-xs font-bold text-white">
                {initials}
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">{user?.nombre}</p>
                <p className="truncate text-[11px] text-muted-foreground">{user?.rol.nombre}</p>
              </div>
            </div>

            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </header>

        <main className="px-4 pb-24 pt-6 md:px-6 md:pb-8">
          <Outlet />
        </main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 grid h-16 border-t bg-background md:hidden"
        style={{ gridTemplateColumns: `repeat(${visibleMobileNav.length}, minmax(0, 1fr))` }}
      >
        {visibleMobileNav.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground",
                isActive && "text-primary"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {passwordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8">
          <div className="w-full max-w-md rounded-md border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold">Cambiar contrasena</h2>
                <p className="text-sm text-muted-foreground">{user?.correo}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setPasswordOpen(false);
                  setPasswordFeedback(null);
                }}
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <form className="space-y-4 p-5" onSubmit={handlePasswordSubmit}>
              <label className="block space-y-1 text-sm font-medium">
                <span>Contrasena actual</span>
                <input
                  className="input-control"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
                  }
                  required
                />
              </label>
              <label className="block space-y-1 text-sm font-medium">
                <span>Nueva contrasena</span>
                <input
                  className="input-control"
                  type="password"
                  minLength={8}
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                  }
                  required
                />
              </label>
              <label className="block space-y-1 text-sm font-medium">
                <span>Confirmar contrasena</span>
                <input
                  className="input-control"
                  type="password"
                  minLength={8}
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                  }
                  required
                />
              </label>
              {passwordFeedback && (
                <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                  {passwordFeedback}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setPasswordOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={passwordMutation.isPending}>
                  <KeyRound className="h-4 w-4" />
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

function canSeeNavItem(item: NavItem, hasPermission: (permission: string) => boolean) {
  if (item.permissions?.length) {
    return item.permissions.some((permission) => hasPermission(permission));
  }
  return !item.permission || hasPermission(item.permission);
}
