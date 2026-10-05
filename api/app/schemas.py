from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

class LoginIn(BaseModel):
    email: str = Field(min_length=5, max_length=180)
    senha: str = Field(min_length=1, max_length=128)
    @field_validator("email")
    @classmethod
    def email_basico(cls, value: str) -> str:
        value = value.strip().lower()
        if "@" not in value or "." not in value.rsplit("@", 1)[-1]:
            raise ValueError("Informe um e-mail válido.")
        return value

class UsuarioOut(BaseModel):
    id: int
    nome: str
    email: str
    perfilAcesso: str
    model_config = ConfigDict(from_attributes=True)

class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioOut

class MedicamentoIn(BaseModel):
    nome: str = Field(min_length=2, max_length=180)
    principioAtivo: str = Field(min_length=2, max_length=180)
    descricao: str = Field(default="", max_length=2000)
    numeroLote: str = Field(min_length=1, max_length=80)
    dataFabricacao: date
    dataValidade: date
    quantidade: int = Field(ge=0)
    @model_validator(mode="after")
    def datas_coerentes(self):
        if self.dataValidade <= self.dataFabricacao:
            raise ValueError("A validade deve ser posterior à data de fabricação.")
        return self

class MedicamentoUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=2, max_length=180)
    principioAtivo: str | None = Field(default=None, min_length=2, max_length=180)
    descricao: str | None = Field(default=None, max_length=2000)

class LoteIn(BaseModel):
    numeroLote: str = Field(min_length=1, max_length=80)
    dataFabricacao: date
    dataValidade: date
    quantidade: int = Field(ge=0)
    @model_validator(mode="after")
    def datas_coerentes(self):
        if self.dataValidade <= self.dataFabricacao:
            raise ValueError("A validade deve ser posterior à data de fabricação.")
        return self

class ThresholdIn(BaseModel):
    diasAlertaAmarelo: int = Field(ge=1, le=3650)
    diasAlertaVermelho: int = Field(ge=0, le=3650)
    @model_validator(mode="after")
    def ordem(self):
        if self.diasAlertaVermelho >= self.diasAlertaAmarelo:
            raise ValueError("O limiar vermelho deve ser menor que o amarelo.")
        return self

class DispensacaoIn(BaseModel):
    medicamentoId: int = Field(gt=0)
    loteId: int = Field(gt=0)
    quantidade: int = Field(gt=0)
    confirmacaoRisco: bool = False

class AcaoOut(BaseModel):
    ok: bool = True
    mensagem: str

class ThresholdOut(BaseModel):
    diasAlertaAmarelo: int
    diasAlertaVermelho: int
    atualizadoEm: datetime | None = None

class RelatorioOut(BaseModel):
    geradoEm: datetime
    itens: list[dict]
