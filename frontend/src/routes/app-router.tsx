import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { CategoriesPage } from "@/pages/categories-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { EquipmentPage } from "@/pages/equipment-page";
import { FacultiesPage } from "@/pages/faculties-page";
import { InventoryPage } from "@/pages/inventory-page";
import { LaboratoriesPage } from "@/pages/laboratories-page";
import { LocationsPage } from "@/pages/locations-page";
import { LoginPage } from "@/pages/login-page";
import { LoansPage } from "@/pages/loans-page";
import { PlaceholderPage } from "@/pages/placeholder-page";
import { UsersPage } from "@/pages/users-page";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          {
            index: true,
            element: <DashboardPage />
          },
          {
            path: "inventory",
            element: <InventoryPage />
          },
          {
            path: "equipment",
            element: <EquipmentPage />
          },
          {
            path: "categories",
            element: <CategoriesPage />
          },
          {
            path: "labs",
            element: <LaboratoriesPage />
          },
          {
            path: "locations",
            element: <LocationsPage />
          },
          {
            path: "loans",
            element: <LoansPage />
          },
          {
            path: "returns",
            element: <LoansPage />
          },
          {
            path: "maintenance",
            element: (
              <PlaceholderPage
                title="Mantenimientos"
                description="Control de equipos en mantenimiento preventivo y correctivo."
              />
            )
          },
          {
            path: "faculties",
            element: <FacultiesPage />
          },
          {
            path: "subjects",
            element: (
              <PlaceholderPage
                title="Materias"
                description="Materias asociadas a programas academicos."
              />
            )
          },
          {
            path: "projects",
            element: (
              <PlaceholderPage
                title="Proyectos"
                description="Proyectos academicos, investigativos y de extension."
              />
            )
          },
          {
            path: "activities",
            element: (
              <PlaceholderPage
                title="Actividades"
                description="Actividades asociadas al uso de equipos."
              />
            )
          },
          {
            path: "users",
            element: <UsersPage />
          },
          {
            path: "reports",
            element: (
              <PlaceholderPage
                title="Reportes"
                description="Reportes PDF y Excel para coordinacion, decano y directores."
              />
            )
          },
          {
            path: "audit",
            element: (
              <PlaceholderPage
                title="Auditoria"
                description="Trazabilidad de acciones criticas del sistema."
              />
            )
          },
          {
            path: "settings",
            element: (
              <PlaceholderPage
                title="Configuracion"
                description="Parametros operativos de SILAB FCI."
              />
            )
          }
        ]
      }
    ]
  }
]);
