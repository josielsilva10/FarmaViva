from datetime import date, datetime, timezone
from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Usuario(Base):
    __tablename__ = "usuarios"
    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(180), unique=True, index=True, nullable=False)
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    perfil_acesso: Mapped[str] = mapped_column(String(24), default="FARMACEUTICO", nullable=False)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

class Medicamento(Base):
    __tablename__ = "medicamentos"
    id: Mapped[int] = mapped_column(primary_key=True)
    nome: Mapped[str] = mapped_column(String(180), index=True, nullable=False)
    principio_ativo: Mapped[str] = mapped_column(String(180), nullable=False)
    descricao: Mapped[str] = mapped_column(Text, default="", nullable=False)
    data_cadastro: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    lotes: Mapped[list["Lote"]] = relationship(back_populates="medicamento", cascade="all, delete-orphan", order_by="Lote.data_validade")

class Lote(Base):
    __tablename__ = "lotes"
    __table_args__ = (UniqueConstraint("medicamento_id", "numero_lote", name="uq_medicamento_lote"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    medicamento_id: Mapped[int] = mapped_column(ForeignKey("medicamentos.id"), index=True, nullable=False)
    numero_lote: Mapped[str] = mapped_column(String(80), nullable=False)
    data_fabricacao: Mapped[date] = mapped_column(Date, nullable=False)
    data_validade: Mapped[date] = mapped_column(Date, index=True, nullable=False)
    quantidade: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    medicamento: Mapped[Medicamento] = relationship(back_populates="lotes")

class ThresholdConfig(Base):
    __tablename__ = "threshold_config"
    id: Mapped[int] = mapped_column(primary_key=True)
    unidade: Mapped[str] = mapped_column(String(120), default="farmaviva", unique=True, nullable=False)
    dias_alerta_amarelo: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    dias_alerta_vermelho: Mapped[int] = mapped_column(Integer, default=15, nullable=False)
    atualizado_em: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow, nullable=False)

class MovimentacaoEstoque(Base):
    __tablename__ = "movimentacoes_estoque"
    id: Mapped[int] = mapped_column(primary_key=True)
    lote_id: Mapped[int] = mapped_column(ForeignKey("lotes.id"), index=True, nullable=False)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False)
    quantidade: Mapped[int] = mapped_column(Integer, nullable=False)
    data_hora: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    usuario_id: Mapped[int] = mapped_column(ForeignKey("usuarios.id"), nullable=False)
    observacao: Mapped[str] = mapped_column(String(255), default="", nullable=False)
    lote: Mapped[Lote] = relationship()
    usuario: Mapped[Usuario] = relationship()

class LogAuditoria(Base):
    __tablename__ = "logs_auditoria"
    id: Mapped[int] = mapped_column(primary_key=True)
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id"), nullable=True)
    acao: Mapped[str] = mapped_column(String(300), nullable=False)
    entidade: Mapped[str] = mapped_column(String(80), default="sistema", nullable=False)
    entidade_id: Mapped[str] = mapped_column(String(80), default="", nullable=False)
    data_hora: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
