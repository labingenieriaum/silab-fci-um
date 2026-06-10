import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import {
  ActivitiesPage,
  ProjectsPage,
  SeedbedsPage,
  SubjectsPage
} from "@/pages/academic-catalog-pages";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { CategoriesPage } from "@/pages/categories-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { DeliveryActPage } from "@/pages/delivery-act-page";
import { EquipmentPage } from "@/pages/equipment-page";
import { FacultiesPage } from "@/pages/faculties-page";
import { InventoryPage } from "@/pages/inventory-page";
import { LaboratoriesPage } from "@/pages/laboratories-page";
import { LocationsPage } from "@/pages/locations-page";
import { LoginPage } from "@/pages/login-page";
import { LoansPage } from "@/pages/loans-page";
import { MaintenancePage } from "@/pages/maintenance-page";
import { PeoplePage } from "@/pages/people-page";
import { PlaceholderPage } from "@/pages/placeholder-page";
import { PublicLoanRequestPage } from "@/pages/public-loan-request-page";
import { ReportsPage } from "@/pages/reports-page";
import { ReturnActPage } from "@/pages/return-act-page";
import { SettingsPage } from "@/pages/settings-page";
import { UsersPage } from "@/pages/users-page";
import { VerifyReportPage } from "@/pages/verify-report-page";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />
  },
  {
    path: "/verify-report/:code",
    element: <VerifyReportPage />
  },
  {
    path: "/solicitar-prestamo",
    element: <PublicLoanRequestPage />
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
            path: "loans/:id/acta-entrega",
            element: <DeliveryActPage />
          },
          {
            path: "returns",
            element: <LoansPage />
          },
          {
            path: "returns/:id/acta",
            element: <ReturnActPage />
          },
          {
            path: "maintenance",
            element: <MaintenancePage />
          },
          {
            path: "faculties",
            element: <FacultiesPage />
          },
          {
            path: "subjects",
            element: <SubjectsPage />
          },
          {
            path: "seedbeds",
            element: <SeedbedsPage />
          },
          {
            path: "projects",
            element: <ProjectsPage />
          },
          {
            path: "activities",
            element: <ActivitiesPage />
          },
          {
            path: "users",
            element: <UsersPage />
          },
          {
            path: "people",
            element: <PeoplePage />
          },
          {
            path: "reports",
            element: <ReportsPage />
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
            element: <SettingsPage />
          }
        ]
      }
    ]
  }
]);
