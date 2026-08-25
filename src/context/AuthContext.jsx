import { createContext, useContext, useEffect, useState } from "react";
import { autenticar, getUsuarioAtual } from "../services/api";

const AuthContext = createContext(null);
const SESSION_KEY = "farmaviva_session_v1";

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const sessao = sessionStorage.getItem(SESSION_KEY);
    if (sessao === "ativa") {
      setUsuario(getUsuarioAtual());
    }
    setCarregando(false);
  }, []);

  async function login(email, senha) {
    const resultado = await autenticar(email, senha);
    if (resultado.ok) {
      sessionStorage.setItem(SESSION_KEY, "ativa");
      setUsuario(resultado.usuario);
    }
    return resultado;
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
