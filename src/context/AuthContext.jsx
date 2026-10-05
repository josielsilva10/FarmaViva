import { createContext, useContext, useEffect, useState } from "react";
import { autenticar, encerrarSessao, getAccessToken, validarSessao } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    if (!getAccessToken()) {
      setCarregando(false);
      return () => { ativo = false; };
    }
    validarSessao().then((user) => {
      if (ativo) {
        setUsuario(user);
        setCarregando(false);
      }
    });
    return () => { ativo = false; };
  }, []);

  async function login(email, senha) {
    const resultado = await autenticar(email, senha);
    if (resultado.ok) setUsuario(resultado.usuario);
    return resultado;
  }

  function logout() {
    encerrarSessao();
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
