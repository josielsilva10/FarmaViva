import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import Icon from "../components/Icon";
import { getLotesComStatus } from "../services/api";
import { formatarData, STATUS, STATUS_LABEL } from "../utils/validade";
import "./Estoque.css";

const FILTROS = [null, STATUS.VERMELHO, STATUS.AMARELO, STATUS.VERDE, STATUS.EXPIRADO];

export default function Estoque() {
  const [linhas, setLinhas] = useState([]);
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    setCarregando(true);
    getLotesComStatus({ busca, statusFiltro }).then((res) => {
      if (ativo) {
        setLinhas(res);
        setCarregando(false);
      }
    });
    return () => {
      ativo = false;
    };
  }, [busca, statusFiltro]);

  return (
    <div>
      <PageHeader
        title="Estoque"
        subtitle="Consulta de medicamentos, lotes e validades"
        action={
          <Link className="btn btn-primary" to="/cadastro">
            <Icon name="cadastro" size={15} />
            Novo medicamento
          </Link>
        }
      />

      <div className="card estoque-card">
        <div className="estoque-toolbar">
          <div className="estoque-search">
            <Icon name="search" size={16} />
            <input
              className="estoque-search__input"
              placeholder="Buscar por nome do medicamento..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
          <div className="estoque-filters">
            {FILTROS.map((f) => (
              <button
                key={f || "todos"}
                className={"chip" + (statusFiltro === f ? " chip--active" : "")}
                onClick={() => setStatusFiltro(f)}
              >
                {f ? STATUS_LABEL[f] : "Todos"}
              </button>
            ))}
          </div>
        </div>

        {carregando ? (
          <p className="estoque-card__loading">Carregando estoque...</p>
        ) : linhas.length === 0 ? (
          <div className="empty-state">
            <span className="empty-state__icon">
              <Icon name="search" size={20} />
            </span>
            <p>Nenhum item encontrado para os filtros selecionados.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Medicamento</th>
                  <th>Princípio ativo</th>
                  <th>Lote</th>
                  <th>Validade</th>
                  <th>Qtd.</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {linhas.map((l) => (
                  <tr key={l.id}>
                    <td>{l.medicamentoNome}</td>
                    <td className="estoque-muted">{l.principioAtivo}</td>
                    <td className="mono">{l.numeroLote}</td>
                    <td>{formatarData(l.dataValidade)}</td>
                    <td>{l.quantidade}</td>
                    <td>
                      <StatusBadge status={l.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
