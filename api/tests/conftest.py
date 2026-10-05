import os
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-farmaviva-32-characters"
os.environ["DEMO_USER_PASSWORD"] = "FarmaViva123!"
os.environ["ADMIN_PASSWORD"] = "FarmaViva123!"

import pytest
from fastapi.testclient import TestClient
from app.database import Base, SessionLocal, engine
from app.main import app, _seed

@pytest.fixture(autouse=True)
def clean_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        _seed(db)
    yield

@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture
def auth_headers(client):
    response = client.post("/api/auth/login", json={"email": "ana.farmaceutica@farmaviva.com.br", "senha": "FarmaViva123!"})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}
