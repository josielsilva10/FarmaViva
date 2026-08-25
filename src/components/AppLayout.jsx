import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Icon from "./Icon";
import "./AppLayout.css";

export default function AppLayout() {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className="app-layout">
      <div className={"app-layout__sidebar" + (menuAberto ? " is-open" : "")}>
        <Sidebar />
      </div>
      {menuAberto && <div className="app-layout__scrim" onClick={() => setMenuAberto(false)} />}

      <div className="app-layout__main">
        <button
          className="app-layout__menu-btn"
          onClick={() => setMenuAberto((v) => !v)}
          aria-label="Abrir menu"
        >
          <Icon name={menuAberto ? "x" : "dashboard"} size={18} />
        </button>
        <Outlet />
      </div>
    </div>
  );
}
