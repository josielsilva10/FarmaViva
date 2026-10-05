from datetime import date, timedelta


def test_health_and_openapi(client):
    assert client.get("/health").json()["status"] == "ok"
    assert client.get("/openapi.json").status_code == 200


def test_authentication_required_and_login(client):
    assert client.get("/api/medicamentos").status_code == 401
    bad = client.post("/api/auth/login", json={"email": "ana.farmaceutica@farmaviva.com.br", "senha": "errada"})
    assert bad.status_code == 401
    good = client.post("/api/auth/login", json={"email": "ana.farmaceutica@farmaviva.com.br", "senha": "FarmaViva123!"})
    assert good.status_code == 200
    assert good.json()["usuario"]["perfilAcesso"] == "FARMACEUTICO"


def test_create_and_list_medicine(client, auth_headers):
    today = date.today()
    payload = {"nome": "Teste API", "principioAtivo": "Substância X", "descricao": "Teste", "numeroLote": "T-100", "dataFabricacao": (today-timedelta(days=30)).isoformat(), "dataValidade": (today+timedelta(days=120)).isoformat(), "quantidade": 20}
    created = client.post("/api/medicamentos", json=payload, headers=auth_headers)
    assert created.status_code == 201
    assert created.json()["lotes"][0]["numeroLote"] == "T-100"
    assert client.get("/api/medicamentos?q=Teste", headers=auth_headers).json()[0]["nome"] == "Teste API"


def test_reject_invalid_dates_and_threshold_order(client, auth_headers):
    today = date.today().isoformat()
    payload = {"nome": "Inválido", "principioAtivo": "X", "numeroLote": "X-1", "dataFabricacao": today, "dataValidade": today, "quantidade": 1}
    assert client.post("/api/medicamentos", json=payload, headers=auth_headers).status_code == 422
    invalid = client.put("/api/config/thresholds", json={"diasAlertaAmarelo": 10, "diasAlertaVermelho": 15}, headers=auth_headers)
    assert invalid.status_code == 422


def test_dashboard_and_thresholds(client, auth_headers):
    data = client.get("/api/dashboard/alertas", headers=auth_headers)
    assert data.status_code == 200
    assert data.json()["totalMedicamentos"] >= 1
    saved = client.put("/api/config/thresholds", json={"diasAlertaAmarelo": 90, "diasAlertaVermelho": 20}, headers=auth_headers)
    assert saved.status_code == 200
    assert saved.json()["diasAlertaAmarelo"] == 90


def test_fefo_and_expired_lot_block(client, auth_headers):
    meds = client.get("/api/medicamentos", headers=auth_headers).json()
    expired = next((med, lot) for med in meds for lot in med["lotes"] if lot["dataValidade"] < date.today().isoformat())
    med, lot = expired
    response = client.post("/api/dispensacoes", json={"medicamentoId": med["id"], "loteId": lot["id"], "quantidade": 1}, headers=auth_headers)
    assert response.status_code == 409
    assert "vencido" in response.json()["detail"].lower()
    lots = client.get(f"/api/medicamentos/{med['id']}/lotes", headers=auth_headers).json()
    assert [x["dataValidade"] for x in lots] == sorted(x["dataValidade"] for x in lots)


def test_dispense_reduces_stock_and_requires_risk_confirmation(client, auth_headers):
    meds = client.get("/api/medicamentos", headers=auth_headers).json()
    pair = next((med, lot) for med in meds for lot in med["lotes"] if date.today().isoformat() <= lot["dataValidade"] <= (date.today()+timedelta(days=15)).isoformat() and lot["quantidade"] > 1)
    med, lot = pair
    payload = {"medicamentoId": med["id"], "loteId": lot["id"], "quantidade": 1}
    first = client.post("/api/dispensacoes", json=payload, headers=auth_headers)
    if first.status_code == 409 and "Confirme" in first.json()["detail"]:
        payload["confirmacaoRisco"] = True
    result = client.post("/api/dispensacoes", json=payload, headers=auth_headers)
    assert result.status_code == 200
    assert result.json()["quantidadeRestante"] == lot["quantidade"] - 1
