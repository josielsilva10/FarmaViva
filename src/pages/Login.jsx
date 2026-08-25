import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function Login() {
  const { usuario, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("ana.farmaceutica@farmaviva.com.br");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  if (usuario) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    setCarregando(true);
    const resultado = await login(email, senha || "protótipo");
    setCarregando(false);
    if (!resultado.ok) {
      setErro(resultado.message || "Não foi possível entrar.");
      return;
    }
    navigate("/dashboard");
  }

  return (
    <div className="login-screen">
      <div className="login-screen__glow login-screen__glow--a" />
      <div className="login-screen__glow login-screen__glow--b" />

      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-card__brand">
          <span className="login-card__mark">Fv</span>
          <div>
            <p className="login-card__name">FarmaViva</p>
            <p className="login-card__tag">Gestão proativa de validade de medicamentos</p>
          </div>
        </div>

        <div className="field">
          <label htmlFor="email">E-mail institucional</label>
          <input
            id="email"
            className="input"
            type="email"
            placeholder="ana.farmaceutica@farmaviva.com.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
        </div>

        <div className="field">
          <label htmlFor="senha">Senha</label>
          <input
            id="senha"
            className="input"
            type="password"
            placeholder="••••••••"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        {erro && <p className="login-card__error">{erro}</p>}

        <button className="btn btn-primary btn-block" type="submit" disabled={carregando}>
          {carregando ? "Entrando..." : "Entrar"}
        </button>

        <p className="login-card__note">
          Protótipo navegável — clique em "Entrar" para simular o acesso.
        </p>
      </form>
    </div>
  );
}
