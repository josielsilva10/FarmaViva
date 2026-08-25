import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { usuario, carregando } = useAuth();

  if (carregando) return null;
  if (!usuario) return <Navigate to="/login" replace />;
  return children;
}
