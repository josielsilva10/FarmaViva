import os
from datetime import date, datetime, timedelta, timezone
from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload
from .database import Base, SessionLocal, engine, get_db
from . import models, schemas
from .security import create_access_token, decode_subject, hash_password, verify_password

Base.metadata.create_all(bind=engine)
app = FastAPI(title="FarmaViva API", description="API REST para gestão de medicamentos, lotes, validade e dispensação FEFO.", version="1.0.0")
_origins = [value.strip() for value in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if value.strip()]
app.add_middleware(CORSMiddleware, allow_origins=_origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
bearer = HTTPBearer(auto_error=False)


def _seed(db: Session) -> None:
    if not db.scalar(select(models.Usuario.id).limit(1)):
        demo_password = os.getenv("DEMO_USER_PASSWORD", "FarmaViva123!")
        users = [
            models.Usuario(nome="Ana Costa", email="ana.farmaceutica@farmaviva.com.br", senha_hash=hash_password(demo_password), perfil_acesso="FARMACEUTICO"),
            models.Usuario(nome="Gestor FarmaViva", email=os.getenv("ADMIN_EMAIL", "gestor@farmaviva.local"), senha_hash=hash_password(os.getenv("ADMIN_PASSWORD", "FarmaViva123!")), perfil_acesso="GESTOR"),
            models.Usuario(nome="Auxiliar FarmaViva", email="auxiliar@farmaviva.local", senha_hash=hash_password(demo_password), perfil_acesso="AUXILIAR"),
        ]
        db.add_all(users)
    if not db.scalar(select(models.ThresholdConfig.id).limit(1)):
        db.add(models.ThresholdConfig(unidade="farmaviva", dias_alerta_amarelo=60, dias_alerta_vermelho=15))
    if not db.scalar(select(models.Medicamento.id).limit(1)):
        today = date.today()
        catalog = [
            ("Dipirona Sódica 500mg", "Dipirona monoidratada", "Comprimido revestido, caixa com 20 unidades.", [("L-2281", 25, 36), ("L-2299", 180, 140)]),
            ("Amoxicilina 500mg", "Amoxicilina tri-hidratada", "Cápsula, caixa com 21 unidades.", [("L-2198", 10, 18), ("L-2190", -12, 4)]),
            ("Ibuprofeno 400mg", "Ibuprofeno", "Comprimido revestido, caixa com 20 unidades.", [("L-2233", 75, 64)]),
            ("Losartana Potássica 50mg", "Losartana potássica", "Comprimido, caixa com 30 unidades.", [("L-2240", 150, 112)]),
            ("Paracetamol 750mg", "Paracetamol", "Comprimido, caixa com 20 unidades.", [("L-2255", 300, 210)]),
        ]
        for nome, principio, descricao, lotes in catalog:
            medicamento = models.Medicamento(nome=nome, principio_ativo=principio, descricao=descricao)
            for codigo, dias, quantidade in lotes:
                fabricacao = today - timedelta(days=365)
                validade = today + timedelta(days=dias)
                medicamento.lotes.append(models.Lote(numero_lote=codigo, data_fabricacao=fabricacao, data_validade=validade, quantidade=quantidade))
            db.add(medicamento)
    db.commit()

with SessionLocal() as _db:
    _seed(_db)


def current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)) -> models.Usuario:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Autenticação obrigatória.", headers={"WWW-Authenticate": "Bearer"})
    subject = decode_subject(credentials.credentials)
    user = db.scalar(select(models.Usuario).where(models.Usuario.email == subject, models.Usuario.ativo.is_(True))) if subject else None
    if not user:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado.", headers={"WWW-Authenticate": "Bearer"})
    return user

def require_roles(*roles):
    def check(user: models.Usuario = Depends(current_user)):
        if user.perfil_acesso not in roles:
            raise HTTPException(status_code=403, detail="Seu perfil não tem permissão para esta operação.")
        return user
    return check

def _user_out(user: models.Usuario) -> dict:
    return {"id": user.id, "nome": user.nome, "email": user.email, "perfilAcesso": user.perfil_acesso}

def _thresholds(db: Session) -> models.ThresholdConfig:
    row = db.scalar(select(models.ThresholdConfig).where(models.ThresholdConfig.unidade == "farmaviva"))
    if row is None:
        row = models.ThresholdConfig(unidade="farmaviva", dias_alerta_amarelo=60, dias_alerta_vermelho=15)
        db.add(row); db.commit(); db.refresh(row)
    return row

def _status(validade: date, yellow: int, red: int, today: date | None = None) -> tuple[str, int]:
    days = (validade - (today or date.today())).days
    if days < 0: return "EXPIRADO", days
    if days <= red: return "VERMELHO", days
    if days <= yellow: return "AMARELO", days
    return "VERDE", days

def _lote_out(lote: models.Lote, med: models.Medicamento, yellow: int, red: int) -> dict:
    status_value, days = _status(lote.data_validade, yellow, red)
    return {"id": lote.id, "medicamentoId": med.id, "medicamentoNome": med.nome, "principioAtivo": med.principio_ativo,
            "numeroLote": lote.numero_lote, "dataFabricacao": lote.data_fabricacao.isoformat(), "dataValidade": lote.data_validade.isoformat(),
            "quantidade": lote.quantidade, "status": status_value, "diasRestantes": days}

def _med_out(med: models.Medicamento) -> dict:
    return {"id": med.id, "nome": med.nome, "principioAtivo": med.principio_ativo, "descricao": med.descricao,
            "dataCadastro": med.data_cadastro.isoformat(), "lotes": [{"id": l.id, "numeroLote": l.numero_lote,
            "dataFabricacao": l.data_fabricacao.isoformat(), "dataValidade": l.data_validade.isoformat(), "quantidade": l.quantidade} for l in med.lotes]}

def _audit(db: Session, user: models.Usuario | None, action: str, entity: str = "sistema", entity_id: str = "") -> None:
    db.add(models.LogAuditoria(usuario_id=user.id if user else None, acao=action, entidade=entity, entidade_id=str(entity_id)))

@app.get("/health", tags=["sistema"])
def health():
    return {"status": "ok", "servico": "farmaviva-api"}

@app.post("/api/auth/login", response_model=schemas.TokenOut, tags=["autenticação"])
def login(payload: schemas.LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(models.Usuario).where(models.Usuario.email == payload.email, models.Usuario.ativo.is_(True)))
    if not user or not verify_password(payload.senha, user.senha_hash):
        raise HTTPException(status_code=401, detail="E-mail ou senha inválidos.")
    return {"access_token": create_access_token(user.email), "token_type": "bearer", "usuario": _user_out(user)}

@app.get("/api/auth/me", tags=["autenticação"])
def me(user: models.Usuario = Depends(current_user)):
    return _user_out(user)

@app.get("/api/medicamentos", tags=["medicamentos"])
def list_medicamentos(q: str = Query(default="", max_length=180), db: Session = Depends(get_db), user: models.Usuario = Depends(current_user)):
    query = select(models.Medicamento).options(selectinload(models.Medicamento.lotes)).where(models.Medicamento.ativo.is_(True)).order_by(models.Medicamento.nome)
    if q.strip():
        pattern = f"%{q.strip()}%"
        query = query.where((models.Medicamento.nome.ilike(pattern)) | (models.Medicamento.principio_ativo.ilike(pattern)))
    return [_med_out(row) for row in db.scalars(query).unique().all()]

@app.post("/api/medicamentos", status_code=201, tags=["medicamentos"])
def create_medicamento(payload: schemas.MedicamentoIn, db: Session = Depends(get_db), user: models.Usuario = Depends(current_user)):
    med = models.Medicamento(nome=payload.nome.strip(), principio_ativo=payload.principioAtivo.strip(), descricao=payload.descricao.strip())
    med.lotes.append(models.Lote(numero_lote=payload.numeroLote.strip(), data_fabricacao=payload.dataFabricacao, data_validade=payload.dataValidade, quantidade=payload.quantidade))
    db.add(med); db.flush(); _audit(db, user, f"Cadastrou medicamento {med.nome} e lote {payload.numeroLote}.", "medicamento", med.id)
    try: db.commit()
    except IntegrityError: db.rollback(); raise HTTPException(status_code=409, detail="Este número de lote já existe para o medicamento.")
    db.refresh(med)
    return _med_out(med)

@app.get("/api/medicamentos/{medicamento_id}", tags=["medicamentos"])
def get_medicamento(medicamento_id: int, db: Session = Depends(get_db), user: models.Usuario = Depends(current_user)):
    med = db.scalar(select(models.Medicamento).options(selectinload(models.Medicamento.lotes)).where(models.Medicamento.id == medicamento_id, models.Medicamento.ativo.is_(True)))
    if not med: raise HTTPException(status_code=404, detail="Medicamento não encontrado.")
    return _med_out(med)

@app.patch("/api/medicamentos/{medicamento_id}", tags=["medicamentos"])
def update_medicamento(medicamento_id: int, payload: schemas.MedicamentoUpdate, db: Session = Depends(get_db), user: models.Usuario = Depends(current_user)):
    med = db.get(models.Medicamento, medicamento_id)
    if not med or not med.ativo: raise HTTPException(status_code=404, detail="Medicamento não encontrado.")
    for source, target in (("nome", "nome"), ("principioAtivo", "principio_ativo"), ("descricao", "descricao")):
        value = getattr(payload, source)
        if value is not None: setattr(med, target, value.strip())
    _audit(db, user, f"Atualizou medicamento {med.nome}.", "medicamento", med.id); db.commit(); db.refresh(med)
    return _med_out(med)

@app.delete("/api/medicamentos/{medicamento_id}", response_model=schemas.AcaoOut, tags=["medicamentos"])
def delete_medicamento(medicamento_id: int, db: Session = Depends(get_db), user: models.Usuario = Depends(current_user)):
    med = db.get(models.Medicamento, medicamento_id)
    if not med or not med.ativo: raise HTTPException(status_code=404, detail="Medicamento não encontrado.")
    med.ativo = False
    _audit(db, user, f"Inativou medicamento {med.nome}.", "medicamento", med.id); db.commit()
    return {"ok": True, "mensagem": "Medicamento removido da listagem."}

@app.post("/api/medicamentos/{medicamento_id}/lotes", status_code=201, tags=["lotes"])
def add_lote(medicamento_id: int, payload: schemas.LoteIn, db: Session = Depends(get_db), user: models.Usuario = Depends(current_user)):
    med = db.get(models.Medicamento, medicamento_id)
    if not med or not med.ativo: raise HTTPException(status_code=404, detail="Medicamento não encontrado.")
    lote = models.Lote(medicamento_id=med.id, numero_lote=payload.numeroLote.strip(), data_fabricacao=payload.dataFabricacao, data_validade=payload.dataValidade, quantidade=payload.quantidade)
    db.add(lote); db.flush(); _audit(db, user, f"Adicionou lote {lote.numero_lote} a {med.nome}.", "lote", lote.id)
    try: db.commit()
    except IntegrityError: db.rollback(); raise HTTPException(status_code=409, detail="Este número de lote já existe para o medicamento.")
    return _lote_out(lote, med, _thresholds(db).dias_alerta_amarelo, _thresholds(db).dias_alerta_vermelho)

@app.get("/api/lotes", tags=["estoque"])
def list_lotes(busca: str = "", status_filtro: str | None = Query(default=None, alias="status"), db: Session = Depends(get_db), user: models.Usuario = Depends(current_user)):
    config = _thresholds(db); query = select(models.Lote).join(models.Medicamento).options(selectinload(models.Lote.medicamento)).where(models.Medicamento.ativo.is_(True))
    if busca.strip():
        pattern = f"%{busca.strip()}%"; query = query.where((models.Medicamento.nome.ilike(pattern)) | (models.Medicamento.principio_ativo.ilike(pattern)))
    rows = db.scalars(query.order_by(models.Lote.data_validade)).all()
    items = [_lote_out(row, row.medicamento, config.dias_alerta_amarelo, config.dias_alerta_vermelho) for row in rows]
    if status_filtro: items = [row for row in items if row["status"] == status_filtro.upper()]
    return items

@app.get("/api/medicamentos/{medicamento_id}/lotes", tags=["lotes"])
def list_lotes_med(medicamento_id: int, db: Session = Depends(get_db), user: models.Usuario = Depends(current_user)):
    med = db.scalar(select(models.Medicamento).options(selectinload(models.Medicamento.lotes)).where(models.Medicamento.id == medicamento_id, models.Medicamento.ativo.is_(True)))
    if not med: raise HTTPException(status_code=404, detail="Medicamento não encontrado.")
    config = _thresholds(db)
    rows = sorted(med.lotes, key=lambda lote: (lote.data_validade, lote.id))
    return [_lote_out(row, med, config.dias_alerta_amarelo, config.dias_alerta_vermelho) for row in rows]

@app.get("/api/config/thresholds", response_model=schemas.ThresholdOut, tags=["configuração"])
def get_thresholds(db: Session = Depends(get_db), user: models.Usuario = Depends(current_user)):
    row = _thresholds(db)
    return {"diasAlertaAmarelo": row.dias_alerta_amarelo, "diasAlertaVermelho": row.dias_alerta_vermelho, "atualizadoEm": row.atualizado_em}

@app.put("/api/config/thresholds", response_model=schemas.ThresholdOut, tags=["configuração"])
def update_thresholds(payload: schemas.ThresholdIn, db: Session = Depends(get_db), user: models.Usuario = Depends(require_roles("GESTOR", "FARMACEUTICO"))):
    row = _thresholds(db); row.dias_alerta_amarelo = payload.diasAlertaAmarelo; row.dias_alerta_vermelho = payload.diasAlertaVermelho
    _audit(db, user, f"Atualizou thresholds: amarelo={row.dias_alerta_amarelo}, vermelho={row.dias_alerta_vermelho}.", "threshold", row.unidade); db.commit(); db.refresh(row)
    return {"diasAlertaAmarelo": row.dias_alerta_amarelo, "diasAlertaVermelho": row.dias_alerta_vermelho, "atualizadoEm": row.atualizado_em}

@app.get("/api/dashboard/alertas", tags=["dashboard"])
def dashboard(db: Session = Depends(get_db), user: models.Usuario = Depends(current_user)):
    config = _thresholds(db); meds = db.scalars(select(models.Medicamento).options(selectinload(models.Medicamento.lotes)).where(models.Medicamento.ativo.is_(True))).unique().all()
    items = [_lote_out(lote, med, config.dias_alerta_amarelo, config.dias_alerta_vermelho) for med in meds for lote in med.lotes]
    amounts = {key: sum(item["quantidade"] for item in items if item["status"] == key) for key in ("VERDE", "AMARELO", "VERMELHO", "EXPIRADO")}
    total = sum(amounts.values()); pct = lambda value: round(value * 100 / total) if total else 0
    critical = amounts["VERMELHO"] + amounts["EXPIRADO"]
    attention = sorted([item for item in items if item["status"] != "VERDE"], key=lambda item: item["diasRestantes"])[:8]
    return {"totalItens": total, "totalMedicamentos": len(meds), "pctVerde": pct(amounts["VERDE"]), "pctAmarelo": pct(amounts["AMARELO"]), "pctCritico": pct(critical),
            "unidadesVerde": amounts["VERDE"], "unidadesAmarelo": amounts["AMARELO"], "unidadesCritico": critical,
            "itensAtencao": attention, "linhaTempo": sorted(items, key=lambda item: item["diasRestantes"])[:7],
            "thresholds": {"diasAlertaAmarelo": config.dias_alerta_amarelo, "diasAlertaVermelho": config.dias_alerta_vermelho}}

@app.post("/api/dispensacoes", tags=["dispensação"])
def dispense(payload: schemas.DispensacaoIn, db: Session = Depends(get_db), user: models.Usuario = Depends(current_user)):
    med = db.scalar(select(models.Medicamento).where(models.Medicamento.id == payload.medicamentoId, models.Medicamento.ativo.is_(True)))
    lot = db.scalar(select(models.Lote).where(models.Lote.id == payload.loteId, models.Lote.medicamento_id == payload.medicamentoId))
    if not med or not lot: raise HTTPException(status_code=404, detail="Medicamento ou lote inválido/inexistente.")
    if payload.quantidade <= 0: raise HTTPException(status_code=422, detail="Informe uma quantidade válida.")
    if lot.quantidade < payload.quantidade:
        _audit(db, user, f"Tentativa bloqueada: saída maior que o saldo do lote {lot.numero_lote}.", "lote", lot.id); db.commit()
        raise HTTPException(status_code=409, detail=f"Quantidade indisponível. Restam {lot.quantidade} unidades no lote.")
    config = _thresholds(db); status_lote, days = _status(lot.data_validade, config.dias_alerta_amarelo, config.dias_alerta_vermelho)
    if status_lote == "EXPIRADO":
        _audit(db, user, f"Tentativa bloqueada: dispensação de lote vencido {lot.numero_lote} ({med.nome}).", "lote", lot.id); db.commit()
        raise HTTPException(status_code=409, detail="Este lote está vencido. A dispensação foi bloqueada.")
    if status_lote == "VERMELHO" and not payload.confirmacaoRisco:
        raise HTTPException(status_code=409, detail="Confirme a dispensação de lote próximo do vencimento.")
    lot.quantidade -= payload.quantidade
    movement = models.MovimentacaoEstoque(lote_id=lot.id, tipo="SAIDA", quantidade=payload.quantidade, usuario_id=user.id, observacao=f"Dispensação; validade em {days} dias")
    db.add(movement); _audit(db, user, f"Registrou saída de {payload.quantidade} unidade(s) de {med.nome}, lote {lot.numero_lote}.", "movimentacao", lot.id); db.commit()
    return {"ok": True, "quantidadeRestante": lot.quantidade, "movimentacaoId": movement.id}

@app.get("/api/relatorios/proximos-vencimento", tags=["relatórios"])
def report(db: Session = Depends(get_db), user: models.Usuario = Depends(current_user)):
    config = _thresholds(db); lots = db.scalars(select(models.Lote).join(models.Medicamento).options(selectinload(models.Lote.medicamento)).where(models.Medicamento.ativo.is_(True))).all()
    items = [_lote_out(lot, lot.medicamento, config.dias_alerta_amarelo, config.dias_alerta_vermelho) for lot in lots]
    return {"geradoEm": datetime.now(timezone.utc), "itens": [item for item in items if item["status"] != "VERDE"]}

@app.get("/api/auditoria", tags=["auditoria"])
def audit_log(limit: int = Query(default=100, ge=1, le=500), db: Session = Depends(get_db), user: models.Usuario = Depends(require_roles("GESTOR", "FARMACEUTICO"))):
    rows = db.scalars(select(models.LogAuditoria).order_by(models.LogAuditoria.data_hora.desc()).limit(limit)).all()
    return [{"id": row.id, "dataHora": row.data_hora, "usuario": row.usuario.nome if row.usuario else "Sistema", "acao": row.acao, "entidade": row.entidade, "entidadeId": row.entidade_id} for row in rows]
