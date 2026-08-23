"""
Step 7 -- Person A: Authentication & Security Utilities.

Provides:
- PBKDF2-HMAC-SHA256 password hashing and constant-time verification (standard library)
- Lightweight HMAC-SHA256 signed session tokens (zero external dependency)
- Token verification and user context extraction
"""

import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Any

from dotenv import load_dotenv

load_dotenv()

# Secret key for HMAC signing -- reads from env or falls back to a consistent secret
AUTH_SECRET_KEY = (
    os.getenv("AUTH_SECRET_KEY")
    or os.getenv("OPENROUTER_API_KEY")
    or os.getenv("GEMINI_API_KEY")
    or "interview-genius-auth-secret-key-fallback"
).encode("utf-8")

HASH_ALGORITHM = "sha256"
HASH_ITERATIONS = 100_000
TOKEN_LIFETIME_SECONDS = 86400 * 7  # 7 days (604800 seconds)


def hash_password(password: str) -> str:
    """Hashes a password using PBKDF2-HMAC-SHA256 with a unique random salt."""
    salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac(
        HASH_ALGORITHM,
        password.encode("utf-8"),
        salt.encode("utf-8"),
        HASH_ITERATIONS,
    )
    return f"pbkdf2_sha256${HASH_ITERATIONS}${salt}${dk.hex()}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against a stored PBKDF2 hash using constant-time comparison."""
    try:
        parts = hashed_password.split("$")
        if len(parts) != 4 or parts[0] != "pbkdf2_sha256":
            return False

        iterations = int(parts[1])
        salt = parts[2]
        stored_hash = parts[3]

        dk = hashlib.pbkdf2_hmac(
            HASH_ALGORITHM,
            plain_password.encode("utf-8"),
            salt.encode("utf-8"),
            iterations,
        )
        return hmac.compare_digest(dk.hex(), stored_hash)
    except Exception:
        return False


def _b64_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64_decode(data: str) -> bytes:
    padding = 4 - (len(data) % 4)
    if padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data)


def create_access_token(
    user_id: int,
    email: str,
    expires_in_seconds: int = TOKEN_LIFETIME_SECONDS,
) -> str:
    """Generates an HMAC-SHA256 signed access token for a user session."""
    exp = int(time.time()) + expires_in_seconds
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": exp,
    }
    payload_bytes = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    payload_b64 = _b64_encode(payload_bytes)

    signature = hmac.new(AUTH_SECRET_KEY, payload_b64.encode("utf-8"), hashlib.sha256).digest()
    sig_b64 = _b64_encode(signature)

    return f"{payload_b64}.{sig_b64}"


def decode_access_token(token: str) -> dict[str, Any] | None:
    """Validates token signature and expiration, returning decoded payload or None."""
    try:
        parts = token.strip().split(".")
        if len(parts) != 2:
            return None

        payload_b64, sig_b64 = parts
        expected_sig = hmac.new(AUTH_SECRET_KEY, payload_b64.encode("utf-8"), hashlib.sha256).digest()
        actual_sig = _b64_decode(sig_b64)

        if not hmac.compare_digest(expected_sig, actual_sig):
            return None

        payload_bytes = _b64_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))

        if payload.get("exp", 0) < time.time():
            return None  # Token expired

        return payload
    except Exception:
        return None


def extract_user_id_from_header(auth_header: str | None) -> int | None:
    """Extracts and verifies user_id from an Authorization: Bearer <token> header."""
    if not auth_header:
        return None

    parts = auth_header.strip().split(" ")
    token = parts[1] if len(parts) == 2 and parts[0].lower() == "bearer" else parts[0]

    payload = decode_access_token(token)
    if not payload or "user_id" not in payload:
        return None

    return int(payload["user_id"])


def main():
    print("=" * 70)
    print("AUTH UTILS SELF-TEST")
    print("=" * 70)

    # Password test
    password = "SuperSecretPassword123!"
    hashed = hash_password(password)
    print(f"Hashed password format: {hashed[:40]}...")
    assert verify_password(password, hashed), "Password verification failed!"
    assert not verify_password("WrongPassword", hashed), "Invalid password accepted!"
    print("[OK] Password hashing & verification passed.")

    # Token test
    token = create_access_token(user_id=42, email="candidate@example.com")
    print(f"Token: {token[:40]}...")
    payload = decode_access_token(token)
    assert payload is not None and payload["user_id"] == 42, "Token decoding failed!"
    print("[OK] Token signing & decoding passed.")


if __name__ == "__main__":
    main()
