import { useCallback, useEffect, useState } from "react";
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
  const [carregandoMedicamentos, setCarregandoMedicamentos] = useState(true);
  const [carregandoLotes, setCarregandoLotes] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [erroForm, setErroForm] = useState("");
  const [erroCarregamento, setErroCarregamento] = useState("");
  const [tentativaLotes, setTentativaLotes] = useState(0);

  const carregarMedicamentos = useCallback(async () => {
    setCarregandoMedicamentos(true);
    setErroCarregamento("");
    try {
      const meds = await getMedicamentos();
      setMedicamentos(meds);
      if (meds.length) setMedicamentoId(String(meds[0].id));
    } catch (error) {
      setErroCarregamento(error.message);
    } finally {
      setCarregandoMedicamentos(false);
    }
  }, []);

  useEffect(() => { carregarMedicamentos(); }, [carregarMedicamentos]);

  useEffect(() => {
    let ativo = true;
    if (!medicamentoId) {
      setLotes([]);
      setLoteSelecionadoId("");
      setCarregandoLotes(false);
      return () => { ativo = false; };
    }
    setCarregandoLotes(true);
    setLoteSelecionadoId("");
    setErroCarregamento("");
    getLotesPorMedicamentoFEFO(medicamentoId)
      .then((res) => {
        if (!ativo) return;
        setLotes(res);
        const suggested = res.find((lote) => lote.status !== STATUS.EXPIRADO && lote.quantidade > 0) || res[0];
        setLoteSelecionadoId(suggested ? String(suggested.id) : "");
      })
      .catch((error) => { if (ativo) setErroCarregamento(error.message); })
      .finally(() => { if (ativo) setCarregandoLotes(false); });
    return () => { ativo = false; };
  }, [medicamentoId, tentativaLotes]);

  const medicamentoAtual = medicamentos.find((med) => String(med.id) === String(medicamentoId));
  const loteSelecionado = lotes.find((lot) => String(lot.id) === String(loteSelecionadoId));
  const sugeridoId = lotes.find((lot) => lot.status !== STATUS.EXPIRADO && lot.quantidade > 0)?.id;

  async function tentarConfirmar(event) {
    event.preventDefault();
    setErroForm("");
    if (!loteSelecionado) { setErroForm("Selecione um lote válido."); return; }
    const qtd = Number(quantidade);
    if (!Number.isInteger(qtd) || qtd <= 0) { setErroForm("Informe uma quantidade inteira válida."); return; }
    if (qtd > loteSelecionado.quantidade) {
      setErroForm(`Quantidade indisponível. Restam ${loteSelecionado.quantidade} unidades no lote.`);
      return;
    }
    if (loteSelecionado.status === STATUS.EXPIRADO) {
      setConfirmando(true);
      try {
        await registrarDispensacao({ medicamentoId: Number(medicamentoId), loteId: Number(loteSelecionadoId), quantidade: qtd });
      } catch {
        setModal({ tipo: "bloqueado" });
      } finally {
        setConfirmando(false);
      }
      return;
    }
    if (loteSelecionado.status === STATUS.VERMELHO) { setModal({ tipo: "confirmar" }); return; }
    await confirmarDispensacao(false);
  }

  async function confirmarDispensacao(confirmacaoRisco = false) {
    setModal(null);
    setConfirmando(true);
    setErroForm("");
    try {
      await registrarDispensacao({
        medicamentoId: Number(medicamentoId),
        loteId: Number(loteSelecionadoId),
        quantidade: Number(quantidade),
        confirmacaoRisco,
      });
      setToast({ msg: `Saída registrada: ${quantidade} un. de ${medicamentoAtual?.nome}.`, tone: "success" });
      setQuantidade("1");
      const res = await getLotesPorMedicamentoFEFO(medicamentoId);
      setLotes(res);
    } catch (error) {
      setToast({ msg: error.message, tone: "error" });
    } finally {
      setConfirmando(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Dispensação — FEFO"
        subtitle={medicamentoAtual ? `${medicamentoAtual.nome} · sugestão automática pelo lote mais próximo do vencimento` : "Sugestão automática pelo lote mais próximo do vencimento"}
      />
      {erroCarregamento && <div className="empty-state" role="alert"><p>{erroCarregamento}</p><button className="btn btn-secondary" onClick={() => { setTentativaLotes((value) => value + 1); carregarMedicamentos(); }}>Tentar novamente</button></div>}
      {carregandoMedicamentos ? <p className="dispensacao-lotes__loading" role="status">Carregando medicamentos...</p> : medicamentos.length === 0 ? (
        <div className="empty-state"><span className="empty-state__icon"><Icon name="estoque" size={20} /></span><p>Nenhum medicamento cadastrado.</p></div>
      ) : (
        <>
          <div className="field dispensacao-select-med">
            <label htmlFor="medicamento">Medicamento</label>
            <select id="medicamento" className="select" value={medicamentoId} onChange={(e) => setMedicamentoId(e.target.value)}>
              {medicamentos.map((med) => <option key={med.id} value={med.id}>{med.nome}</option>)}
            </select>
          </div>
          <div className="dispensacao-grid">
            <div className="card dispensacao-lotes">
              <h3 className="dispensacao-lotes__title">Lotes disponíveis (ordenados por FEFO)</h3>
              {carregandoLotes ? <p className="dispensacao-lotes__loading" role="status">Consultando lotes...</p> : lotes.length === 0 ? (
                <div className="empty-state"><span className="empty-state__icon"><Icon name="estoque" size={20} /></span><p>Nenhum lote cadastrado para este medicamento.</p></div>
              ) : (
                <ul className="lote-list">
                  {lotes.map((lote) => (
                    <li key={lote.id}>
                      <button type="button" aria-pressed={String(lote.id) === String(loteSelecionadoId)} className={"lote-option" + (String(lote.id) === String(loteSelecionadoId) ? " lote-option--selected" : "") + (lote.status === STATUS.EXPIRADO ? " lote-option--disabled" : "")} onClick={() => setLoteSelecionadoId(String(lote.id))}>
                        <div className="lote-option__top">
                          {String(lote.id) === String(sugeridoId) && <span className="lote-option__tag">Sugerido</span>}
                          <span className="lote-option__code mono">{lote.numeroLote}</span>
                          <span className={"lote-option__days lote-option__days--" + lote.status.toLowerCase()}>{lote.status === STATUS.EXPIRADO ? "Vencido" : formatarDiasRestantes(lote.diasRestantes)}</span>
                        </div>
                        <p className="lote-option__meta">{lote.status === STATUS.EXPIRADO ? `Vencido em ${formatarData(lote.dataValidade)} · bloqueado pelo sistema` : `Vence em ${formatarData(lote.dataValidade)} · ${lote.quantidade} unidades disponíveis`}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <form className="card dispensacao-confirm" onSubmit={tentarConfirmar}>
              <h3 className="dispensacao-lotes__title">Confirmar saída</h3>
              <div className="field"><label htmlFor="loteSel">Lote selecionado</label><input id="loteSel" className="input mono" value={loteSelecionado?.numeroLote || ""} readOnly /></div>
              <div className="field">
                <label htmlFor="qtd">Quantidade a dispensar</label>
                <input id="qtd" type="number" min={1} max={loteSelecionado?.quantidade || undefined} className="input" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
                {loteSelecionado && <span className="field__hint">Disponível no lote: {loteSelecionado.quantidade} unidades</span>}
              </div>
              {erroForm && <p className="field__error" role="alert">{erroForm}</p>}
              <button className="btn btn-primary btn-block" type="submit" disabled={confirmando || carregandoLotes || !loteSelecionado}>{confirmando ? "Registrando..." : "Confirmar dispensação"}</button>
            </form>
          </div>
        </>
      )}
      <Modal open={modal?.tipo === "confirmar"} onClose={() => setModal(null)} title="Item próximo do vencimento" tone="danger" footer={<><button className="btn btn-ghost" onClick={() => setModal(null)}>Cancelar</button><button className="btn btn-danger" onClick={() => confirmarDispensacao(true)}>Confirmar mesmo assim</button></>}>
        O lote <b>{loteSelecionado?.numeroLote}</b> vence em <b>{loteSelecionado && formatarDiasRestantes(loteSelecionado.diasRestantes)}</b>. Confirme que deseja prosseguir com a dispensação deste lote.
      </Modal>
      <Modal open={modal?.tipo === "bloqueado"} onClose={() => setModal(null)} title="Operação bloqueada" tone="danger" footer={<button className="btn btn-primary" onClick={() => setModal(null)}>Entendi</button>}>
        O lote <b>{loteSelecionado?.numeroLote}</b> está <b>vencido</b> (validade em {loteSelecionado && formatarData(loteSelecionado.dataValidade)}). A dispensação foi bloqueada pelo servidor e a tentativa foi registrada em log de auditoria.
      </Modal>
      {toast && <Toast message={toast.msg} tone={toast.tone} onDone={() => setToast(null)} />}
    </div>
  );
}
