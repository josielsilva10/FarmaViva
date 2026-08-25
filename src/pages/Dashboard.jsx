import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import { getDashboardAlertas, atualizarThresholds } from "../services/api";
import { formatarData, formatarDiasRestantes } from "../utils/validade";
import "./Dashboard.css";

export default function Dashboard() {
  const [dados, setDados] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [toast, setToast] = useState(null);

  async function carregar() {
    setCarregando(true);
    const resultado = await getDashboardAlertas();
    setDados(resultado);
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  return (
    <div>
      <PageHeader
        title="Painel de Validade"
        subtitle="Visão geral do risco de vencimento em todo o estoque"
        action={
          <button className="btn btn-secondary" onClick={() => setModalAberto(true)}>
            <Icon name="cadastro" size={15} />
            Configurar thresholds
          </button>
        }
      />

      {carregando || !dados ? (
        <p className="dashboard__loading">Carregando painel...</p>
      ) : (
        <>
          <div className="kpi-grid">
            <div className="card kpi-card">
              <p className="kpi-card__label">Total de itens</p>
              <p className="kpi-card__value">{dados.totalItens.toLocaleString("pt-BR")}</p>
              <p className="kpi-card__foot">em {dados.totalMedicamentos} medicamentos cadastrados</p>
            </div>
            <div className="card kpi-card kpi-card--verde">
              <p className="kpi-card__label">
                <span className="kpi-card__dot kpi-card__dot--verde" /> Dentro do prazo
              </p>
              <p className="kpi-card__value">{dados.pctVerde}%</p>
              <p className="kpi-card__foot">{dados.unidadesVerde.toLocaleString("pt-BR")} unidades</p>
            </div>
            <div className="card kpi-card kpi-card--amarelo">
              <p className="kpi-card__label">
                <span className="kpi-card__dot kpi-card__dot--amarelo" /> Atenção (≤ {dados.thresholds.diasAlertaAmarelo} dias)
              </p>
              <p className="kpi-card__value">{dados.pctAmarelo}%</p>
              <p className="kpi-card__foot">{dados.unidadesAmarelo.toLocaleString("pt-BR")} unidades</p>
            </div>
            <div className="card kpi-card kpi-card--critico">
              <p className="kpi-card__label">
                <span className="kpi-card__dot kpi-card__dot--critico" /> Crítico / vencido
              </p>
              <p className="kpi-card__value">{dados.pctCritico}%</p>
              <p className="kpi-card__foot">{dados.unidadesCritico.toLocaleString("pt-BR")} unidades — ação imediata</p>
            </div>
          </div>

          <section className="card timeline-card">
            <div className="timeline-card__header">
              <h3>Linha do tempo FEFO — lotes ordenados por proximidade do vencimento</h3>
              <Link className="btn btn-ghost btn-sm" to="/dispensacao">
                Ir para Dispensação <Icon name="arrowRight" size={14} />
              </Link>
            </div>
            {dados.linhaTempo.length === 0 ? (
              <p className="dashboard__empty-inline">Nenhum lote cadastrado ainda.</p>
            ) : (
              <div className="timeline">
                {dados.linhaTempo.map((lote) => (
                  <div className="timeline__item" key={lote.id}>
                    <span className={"timeline__dot timeline__dot--" + lote.status.toLowerCase()} />
                    <span className="timeline__code mono">{lote.numeroLote}</span>
                    <span className="timeline__days">{formatarDiasRestantes(lote.diasRestantes)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card attention-card">
            <div className="timeline-card__header">
              <h3>Itens que exigem atenção esta semana</h3>
            </div>
            {dados.itensAtencao.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state__icon">
                  <Icon name="check" size={20} />
                </span>
                <p>Nenhum item em risco no momento. Bom trabalho!</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Medicamento</th>
                      <th>Lote</th>
                      <th>Validade</th>
                      <th>Qtd.</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dados.itensAtencao.map((item) => (
                      <tr key={item.id}>
                        <td>{item.medicamentoNome}</td>
                        <td className="mono">{item.numeroLote}</td>
                        <td>{formatarData(item.dataValidade)}</td>
                        <td>{item.quantidade}</td>
                        <td>
                          <StatusBadge status={item.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      <ThresholdModal
        open={modalAberto}
        thresholds={dados?.thresholds}
        onClose={() => setModalAberto(false)}
        onSaved={(msg) => {
          setModalAberto(false);
          setToast(msg);
          carregar();
        }}
      />

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}

function ThresholdModal({ open, thresholds, onClose, onSaved }) {
  const [amarelo, setAmarelo] = useState(thresholds?.diasAlertaAmarelo ?? 60);
  const [vermelho, setVermelho] = useState(thresholds?.diasAlertaVermelho ?? 15);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (open && thresholds) {
      setAmarelo(thresholds.diasAlertaAmarelo);
      setVermelho(thresholds.diasAlertaVermelho);
    }
  }, [open, thresholds]);

  const invalido = Number(vermelho) >= Number(amarelo);

  async function salvar() {
    if (invalido) return;
    setSalvando(true);
    await atualizarThresholds({ diasAlertaAmarelo: amarelo, diasAlertaVermelho: vermelho });
    setSalvando(false);
    onSaved("Thresholds atualizados e aplicados imediatamente.");
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Configurar thresholds de alerta"
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={salvar} disabled={salvando || invalido}>
            {salvando ? "Salvando..." : "Salvar configuração"}
          </button>
        </>
      }
    >
      <div className="threshold-form">
        <p>Defina, em dias, quando cada cor de alerta passa a ser exibida para os lotes cadastrados.</p>
        <div className="field">
          <label htmlFor="amarelo">Dias para alerta amarelo (Atenção)</label>
          <input
            id="amarelo"
            className="input"
            type="number"
            min={1}
            value={amarelo}
            onChange={(e) => setAmarelo(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="vermelho">Dias para alerta vermelho (Crítico)</label>
          <input
            id="vermelho"
            className="input"
            type="number"
            min={0}
            value={vermelho}
            onChange={(e) => setVermelho(e.target.value)}
          />
        </div>
        {invalido && <p className="field__error">O limiar vermelho deve ser menor que o amarelo.</p>}
      </div>
    </Modal>
  );
}
