from app.infrastructure.security import (
    AuthError,
    create_access_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.domain.models import Role


def test_password_hash_roundtrip():
    hashed = hash_password("senha12345")
    assert hashed != "senha12345"
    assert verify_password("senha12345", hashed)
    assert not verify_password("outra", hashed)


def test_access_token_payload():
    token = create_access_token(user_id="u1", email="a@b.com", role=Role.PROFESSOR)
    payload = decode_token(token, expected_type="access")
    assert payload["sub"] == "u1"
    assert payload["role"] == "professor"


def test_wrong_token_type_raises():
    token = create_access_token(user_id="u1", email="a@b.com", role=Role.ALUNO)
    try:
        decode_token(token, expected_type="refresh")
        assert False, "should have raised"
    except AuthError:
        pass
