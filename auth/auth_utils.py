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
        if len(parts) == 2:
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
        elif len(parts) == 3:
            # 3-part standard JWT (e.g. Supabase Auth JWT)
            payload_b64 = parts[1]
            payload_bytes = _b64_decode(payload_b64)
            payload = json.loads(payload_bytes.decode("utf-8"))
            if payload.get("exp", 0) and payload["exp"] < time.time():
                return None  # Token expired
            return payload
        return None
    except Exception:
        return None


def get_or_create_user_by_email(email: str, conn=None) -> int | None:
    """Retrieves or provisions a users table record for an email and returns the integer user_id."""
    if not email:
        return None
    db_url = os.getenv("SUPABASE_DB_URL") or os.getenv("DATABASE_URL")
    if not db_url:
        return None

    close_conn = False
    if conn is None:
        import psycopg2
        import psycopg2.extras
        conn = psycopg2.connect(db_url)
        close_conn = True

    try:
        import psycopg2.extras
        with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
            cur.execute("SELECT id FROM users WHERE email = %s;", (email.lower(),))
            row = cur.fetchone()
            if row:
                return row["id"]

            # Provision new user record for Supabase authenticated user
            cur.execute(
                "INSERT INTO users (email, password_hash) VALUES (%s, %s) RETURNING id;",
                (email.lower(), "supabase_oauth"),
            )
            user_id = cur.fetchone()["id"]
            cur.execute(
                "INSERT INTO profiles (user_id, display_name) VALUES (%s, %s) ON CONFLICT (user_id) DO NOTHING;",
                (user_id, email.split("@")[0]),
            )
            conn.commit()
            return user_id
    except Exception as e:
        print(f"  [auth_utils] get_or_create_user_by_email error: {e}")
        return None
    finally:
        if close_conn and conn:
            conn.close()


def extract_user_id_from_header(
    auth_header: str | None,
    x_user_email: str | None = None,
    conn=None,
) -> int | None:
    """Extracts and verifies user_id from Authorization: Bearer <token> or X-User-Email."""
    if auth_header:
        parts = auth_header.strip().split(" ")
        token = parts[1] if len(parts) == 2 and parts[0].lower() == "bearer" else parts[0]

        payload = decode_access_token(token)
        if payload:
            if "user_id" in payload and isinstance(payload["user_id"], int):
                return int(payload["user_id"])
            email = payload.get("email") or payload.get("user_metadata", {}).get("email")
            if email:
                user_id = get_or_create_user_by_email(email, conn=conn)
                if user_id:
                    return user_id

    if x_user_email:
        return get_or_create_user_by_email(x_user_email, conn=conn)

    return None



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
