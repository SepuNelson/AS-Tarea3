import type { ReactNode } from "react";
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";
import { LoginPage } from "@/features/auth/LoginPage";
import { RegisterPage } from "@/features/auth/RegisterPage";
import { DashboardLayout } from "@/pages/dashboard/DashboardLayout";
import { useAuthStore } from "@/store/authStore";
import { useProfile } from "@/features/auth/hooks";

import { Skeleton } from "@/components/ui/Skeleton";

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  const { isLoading } = useProfile();

  if (!token) return <Navigate to="/login" replace />;
  if (isLoading) {
    return (
      <div className="app-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div style={{ width: "300px", textAlign: "center" }}>
           <Skeleton height="30px" style={{ marginBottom: "10px" }} />
           <Skeleton height="20px" width="80%" style={{ margin: "0 auto" }} />
        </div>
      </div>
    );
  }
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  if (token) return <Navigate to="/app" replace />;
  return <>{children}</>;
};

const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/app" replace /> },
  { path: "/login", element: <PublicRoute><LoginPage /></PublicRoute> },
  { path: "/register", element: <PublicRoute><RegisterPage /></PublicRoute> },
  {
    path: "/app/*",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
  },
  { path: "*", element: <Navigate to="/app" replace /> },
]);

export const AppRouter = () => <RouterProvider router={router} />;

