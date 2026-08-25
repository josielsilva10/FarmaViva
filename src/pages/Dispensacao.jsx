import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import Icon from "../components/Icon";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import { getMedicamentos, getLotesPorMedicamentoFEFO, registrarDispensacao } from "../services/api";
import { formatarData, formatarDiasRestantes, STATUS } from "../utils/validade";
import "./Dispensacao.css";

export default function Dispensacao() {
  const [medicamentos, setMedicamentos] = useState([]);
  const [medicamentoId, setMedicamentoId] = useState("");
  const [lotes, setLotes] = useState([]);
  const [loteSelecionadoId, setLoteSelecionadoId] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [carregandoLotes, setCarregandoLotes] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [modal, setModal] = useState(null); // { lote, motivo }
  const [toast, setToast] = useState(null);
  const [erroForm, setErroForm] = useState("");

  useEffect(() => {
    getMedicamentos().then((meds) => {
      setMedicamentos(meds);
      if (meds.length) setMedicamentoId(meds[0].id);
    });
  }, []);

  useEffect(() => {
    if (!medicamentoId) return;
    setCarregandoLotes(true);
    setLoteSelecionadoId("");
    getLotesPorMedicamentoFEFO(medicamentoId).then((res) => {
      setLotes(res);
      const sugerido = res.find((l) => l.status !== STATUS.EXPIRADO && l.quantidade > 0) || res[0];
      setLoteSelecionadoId(sugerido?.id || "");
      setCarregandoLotes(false);
    });
  }, [medicamentoId]);

  const medicamentoAtual = medicamentos.find((m) => m.id === medicamentoId);
  const loteSelecionado = lotes.find((l) => l.id === loteSelecionadoId);
  const sugeridoId = lotes.find((l) => l.status !== STATUS.EXPIRADO && l.quantidade > 0)?.id;

  function tentarConfirmar(e) {
    e.preventDefault();
    setErroForm("");
    if (!loteSelecionado) {
      setErroForm("Selecione um lote válido.");
      return;
    }
    const qtd = Number(quantidade);
    if (!qtd || qtd <= 0) {
      setErroForm("Informe uma quantidade válida.");
      return;
    }

    // RF07/RF08 — alerta antes de concluir dispensação de lote vencido ou próximo do vencimento.
    if (loteSelecionado.status === STATUS.EXPIRADO) {
      setModal({ tipo: "bloqueado" });
      return;
    }
    if (loteSelecionado.status === STATUS.VERMELHO) {
      setModal({ tipo: "confirmar" });
      return;
    }
    confirmarDispensacao();
  }

  async function confirmarDispensacao() {
    setModal(null);
    setConfirmando(true);
    const resultado = await registrarDispensacao({
      medicamentoId,
      loteId: loteSelecionadoId,
      quantidade: Number(quantidade),
    });
    setConfirmando(false);

    if (!resultado.ok) {
      setToast({ msg: resultado.erro, tone: "error" });
      return;
    }

    setToast({ msg: `Saída registrada: ${quantidade} un. de ${medicamentoAtual?.nome}.`, tone: "success" });
    setQuantidade("1");
    const res = await getLotesPorMedicamentoFEFO(medicamentoId);
    setLotes(res);
  }

  return (
    <div>
      <PageHeader
        title="Dispensação — FEFO"
        subtitle={
          medicamentoAtual
            ? `${medicamentoAtual.nome} · sugestão automática pelo lote mais próximo do vencimento`
            : "Sugestão automática pelo lote mais próximo do vencimento"
        }
      />

      <div className="field dispensacao-select-med">
        <label htmlFor="medicamento">Medicamento</label>
        <select
          id="medicamento"
          className="select"
          value={medicamentoId}
          onChange={(e) => setMedicamentoId(e.target.value)}
        >
          {medicamentos.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="dispensacao-grid">
        <div className="card dispensacao-lotes">
          <h3 className="dispensacao-lotes__title">Lotes disponíveis (ordenados por FEFO)</h3>

          {carregandoLotes ? (
            <p className="dispensacao-lotes__loading">Consultando lotes...</p>
          ) : lotes.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state__icon">
                <Icon name="estoque" size={20} />
              </span>
              <p>Nenhum lote cadastrado para este medicamento.</p>
            </div>
          ) : (
            <ul className="lote-list">
              {lotes.map((lote) => (
                <li key={lote.id}>
                  <button
                    type="button"
                    className={
                      "lote-option" +
                      (lote.id === loteSelecionadoId ? " lote-option--selected" : "") +
                      (lote.status === STATUS.EXPIRADO ? " lote-option--disabled" : "")
                    }
                    onClick={() => setLoteSelecionadoId(lote.id)}
                  >
                    <div className="lote-option__top">
                      {lote.id === sugeridoId && <span className="lote-option__tag">Sugerido</span>}
                      <span className="lote-option__code mono">{lote.numeroLote}</span>
                      <span className={"lote-option__days lote-option__days--" + lote.status.toLowerCase()}>
                        {lote.status === STATUS.EXPIRADO ? "Vencido" : formatarDiasRestantes(lote.diasRestantes)}
                      </span>
                    </div>
                    <p className="lote-option__meta">
                      {lote.status === STATUS.EXPIRADO
                        ? `Vencido em ${formatarData(lote.dataValidade)} · bloqueado pelo sistema`
                        : `Vence em ${formatarData(lote.dataValidade)} · ${lote.quantidade} unidades disponíveis`}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <form className="card dispensacao-confirm" onSubmit={tentarConfirmar}>
          <h3 className="dispensacao-lotes__title">Confirmar saída</h3>

          <div className="field">
            <label htmlFor="loteSel">Lote selecionado</label>
            <input id="loteSel" className="input mono" value={loteSelecionado?.numeroLote || ""} readOnly />
          </div>

          <div className="field">
            <label htmlFor="qtd">Quantidade a dispensar</label>
            <input
              id="qtd"
              type="number"
              min={1}
              max={loteSelecionado?.quantidade || undefined}
              className="input"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
            />
            {loteSelecionado && (
              <span className="field__hint">Disponível no lote: {loteSelecionado.quantidade} unidades</span>
            )}
          </div>

          {erroForm && <p className="field__error">{erroForm}</p>}

          <button className="btn btn-primary btn-block" type="submit" disabled={confirmando || !loteSelecionado}>
            {confirmando ? "Registrando..." : "Confirmar dispensação"}
          </button>
        </form>
      </div>

      <Modal
        open={modal?.tipo === "confirmar"}
        onClose={() => setModal(null)}
        title="Item próximo do vencimento"
        tone="danger"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setModal(null)}>
              Cancelar
            </button>
            <button className="btn btn-danger" onClick={confirmarDispensacao}>
              Confirmar mesmo assim
            </button>
          </>
        }
      >
        O lote <b>{loteSelecionado?.numeroLote}</b> vence em{" "}
        <b>{loteSelecionado && formatarDiasRestantes(loteSelecionado.diasRestantes)}</b>. Confirme que deseja
        prosseguir com a dispensação deste lote.
      </Modal>

      <Modal
        open={modal?.tipo === "bloqueado"}
        onClose={() => setModal(null)}
        title="Operação bloqueada"
        tone="danger"
        footer={
          <button className="btn btn-primary" onClick={() => setModal(null)}>
            Entendi
          </button>
        }
      >
        O lote <b>{loteSelecionado?.numeroLote}</b> está <b>vencido</b> (validade em{" "}
        {loteSelecionado && formatarData(loteSelecionado.dataValidade)}). A dispensação foi bloqueada
        automaticamente pelo sistema e a tentativa foi registrada em log de auditoria.
      </Modal>

      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  );
}
