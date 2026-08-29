from fastapi.testclient import TestClient

from main import app

# TestClient lets the tests send requests to the FastAPI application
client = TestClient(app)


def test_app_loads():
    """The FastAPI application should start successfully."""
    assert app is not None


def test_openapi_is_available():
    """FastAPI should expose a valid OpenAPI document."""
    response = client.get("/openapi.json")

    assert response.status_code == 200

    data = response.json()

    assert "openapi" in data
    assert "paths" in data


def test_docs_route_is_available():
    """The API documentation page should be reachable."""
    response = client.get("/docs")

    assert response.status_code == 200


def test_unknown_route_returns_404():
    """An invalid endpoint should return a normal 404 response."""
    response = client.get("/this-route-does-not-exist")

    assert response.status_code == 404


def test_openapi_has_routes():
    """The project should expose at least one application route."""
    response = client.get("/openapi.json")
    paths = response.json()["paths"]

    assert len(paths) > 0