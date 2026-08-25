import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Toast from "../components/Toast";
import { criarMedicamento } from "../services/api";
import "./Cadastro.css";

const VAZIO = {
  nome: "",
  principioAtivo: "",
  descricao: "",
  numeroLote: "",
  quantidade: "",
  dataFabricacao: "",
  dataValidade: "",
};

export default function Cadastro() {
  const navigate = useNavigate();
  const [form, setForm] = useState(VAZIO);
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState(null);

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
    if (erros[campo]) setErros((e) => ({ ...e, [campo]: null }));
  }

  function validar() {
    const e = {};
    if (!form.nome.trim()) e.nome = "Informe o nome do medicamento.";
    if (!form.principioAtivo.trim()) e.principioAtivo = "Informe o princípio ativo.";
    if (!form.numeroLote.trim()) e.numeroLote = "Informe o número do lote.";
    if (!form.quantidade || Number(form.quantidade) <= 0) e.quantidade = "Informe uma quantidade válida.";
    if (!form.dataFabricacao) e.dataFabricacao = "Informe a data de fabricação.";
    if (!form.dataValidade) e.dataValidade = "Informe a data de validade.";
    if (form.dataFabricacao && form.dataValidade && form.dataValidade <= form.dataFabricacao) {
      e.dataValidade = "A validade deve ser posterior à data de fabricação.";
    }
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev) {
    ev.preventDefault();
    if (!validar()) return;
    setSalvando(true);
    await criarMedicamento(form);
    setSalvando(false);
    setToast(`"${form.nome}" cadastrado com sucesso.`);
    setForm(VAZIO);
  }

  function cancelar() {
    setForm(VAZIO);
    setErros({});
    navigate("/estoque");
  }

  return (
    <div>
      <PageHeader title="Cadastro de Medicamento" subtitle="Inclua um novo medicamento e o primeiro lote associado" />

      <form className="card cadastro-form" onSubmit={handleSubmit} noValidate>
        <div className="cadastro-grid">
          <div className="field">
            <label htmlFor="nome">Nome do medicamento</label>
            <input
              id="nome"
              className={"input" + (erros.nome ? " has-error" : "")}
              placeholder="Ex.: Dipirona Sódica 500mg"
              value={form.nome}
              onChange={(e) => set("nome", e.target.value)}
            />
            {erros.nome && <span className="field__error">{erros.nome}</span>}
          </div>

          <div className="field">
            <label htmlFor="principio">Princípio ativo</label>
            <input
              id="principio"
              className={"input" + (erros.principioAtivo ? " has-error" : "")}
              placeholder="Ex.: Dipirona monoidratada"
              value={form.principioAtivo}
              onChange={(e) => set("principioAtivo", e.target.value)}
            />
            {erros.principioAtivo && <span className="field__error">{erros.principioAtivo}</span>}
          </div>
        </div>

        <div className="field">
          <label htmlFor="descricao">Descrição</label>
          <textarea
            id="descricao"
            className="textarea"
            placeholder="Forma farmacêutica, apresentação, observações..."
            value={form.descricao}
            onChange={(e) => set("descricao", e.target.value)}
          />
        </div>

        <div className="cadastro-grid">
          <div className="field">
            <label htmlFor="lote">Número do lote</label>
            <input
              id="lote"
              className={"input mono" + (erros.numeroLote ? " has-error" : "")}
              placeholder="L-XXXX"
              value={form.numeroLote}
              onChange={(e) => set("numeroLote", e.target.value)}
            />
            {erros.numeroLote && <span className="field__error">{erros.numeroLote}</span>}
          </div>

          <div className="field">
            <label htmlFor="quantidade">Quantidade</label>
            <input
              id="quantidade"
              type="number"
              min={1}
              className={"input" + (erros.quantidade ? " has-error" : "")}
              placeholder="0"
              value={form.quantidade}
              onChange={(e) => set("quantidade", e.target.value)}
            />
            {erros.quantidade && <span className="field__error">{erros.quantidade}</span>}
          </div>
        </div>

        <div className="cadastro-grid">
          <div className="field">
            <label htmlFor="fabricacao">Data de fabricação</label>
            <input
              id="fabricacao"
              type="date"
              className={"input" + (erros.dataFabricacao ? " has-error" : "")}
              value={form.dataFabricacao}
              onChange={(e) => set("dataFabricacao", e.target.value)}
            />
            {erros.dataFabricacao && <span className="field__error">{erros.dataFabricacao}</span>}
          </div>

          <div className="field">
            <label htmlFor="validade">Data de validade</label>
            <input
              id="validade"
              type="date"
              className={"input" + (erros.dataValidade ? " has-error" : "")}
              value={form.dataValidade}
              onChange={(e) => set("dataValidade", e.target.value)}
            />
            {erros.dataValidade ? (
              <span className="field__error">{erros.dataValidade}</span>
            ) : (
              <span className="field__hint">Deve ser posterior à fabricação</span>
            )}
          </div>
        </div>

        <div className="cadastro-actions">
          <button className="btn btn-primary" type="submit" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar medicamento"}
          </button>
          <button className="btn btn-ghost" type="button" onClick={cancelar}>
            Cancelar
          </button>
        </div>
      </form>

      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
