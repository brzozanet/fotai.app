import { useAuthStore } from "@/store/authStore";
import { Navigate, Outlet } from "react-router-dom";

export function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <>
        <Navigate to="/login.html" replace />
      </>
    );
  } else {
    return (
      <>
        <Outlet />
      </>
    );
  }
}
