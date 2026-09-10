"""Integration tests for the auth routes."""

import pytest
import pytest_asyncio
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register_and_login(client: AsyncClient):
    # Register
    resp = await client.post("/auth/register", json={
        "email": "test@example.com",
        "username": "testuser",
        "password": "securepassword",
        "is_native_speaker": False,
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "test@example.com"
    assert data["role"] == "learner"

    # Login
    resp = await client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "securepassword",
    })
    assert resp.status_code == 200
    token = resp.json()["access_token"]
    assert token

    # /me
    resp = await client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["username"] == "testuser"


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient):
    await client.post("/auth/register", json={
        "email": "dup@example.com",
        "username": "dup1",
        "password": "pw",
    })
    resp = await client.post("/auth/register", json={
        "email": "dup@example.com",
        "username": "dup2",
        "password": "pw",
    })
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post("/auth/register", json={
        "email": "pw@example.com",
        "username": "pwuser",
        "password": "correct",
    })
    resp = await client.post("/auth/login", json={
        "email": "pw@example.com",
        "password": "wrong",
    })
    assert resp.status_code == 401
