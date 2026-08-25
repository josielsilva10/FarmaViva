import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Icon from "./Icon";
import "./Sidebar.css";

const ITENS = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/estoque", label: "Estoque", icon: "estoque" },
  { to: "/cadastro", label: "Cadastro", icon: "cadastro" },
  { to: "/dispensacao", label: "Dispensação", icon: "dispensacao" },
];

export default function Sidebar() {
  const { usuario, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <span className="sidebar__mark">Fv</span>
        <div>
          <p className="sidebar__brand-name">FarmaViva</p>
          <p className="sidebar__brand-tag">Gestão de validade</p>
        </div>
      </div>

      <nav className="sidebar__nav">
        {ITENS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => "sidebar__link" + (isActive ? " sidebar__link--active" : "")}
          >
            <Icon name={item.icon} size={17} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <div className="sidebar__user">
          <div className="sidebar__avatar">{usuario?.nome?.[0] ?? "?"}</div>
          <div className="sidebar__user-info">
            <p className="sidebar__user-name">{usuario?.nome}</p>
            <p className="sidebar__user-role">FarmaViva</p>
          </div>
        </div>
        <button className="sidebar__logout" onClick={logout} title="Sair" aria-label="Sair">
          <Icon name="logout" size={16} />
        </button>
      </div>
    </aside>
  );
}
