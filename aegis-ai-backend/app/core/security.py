from datetime import (
    datetime,
    timedelta,
    timezone,
)

import jwt
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash

from app.core.config import get_settings


settings = get_settings()

password_hasher = PasswordHash.recommended()


def hash_password(password: str) -> str:
    return password_hasher.hash(password)


def verify_password(
    plain_password: str,
    stored_password_hash: str,
) -> bool:
    return password_hasher.verify(
        plain_password,
        stored_password_hash,
    )


def create_access_token(
    subject: str,
    expires_delta: timedelta | None = None,
) -> str:
    current_time = datetime.now(timezone.utc)

    expiration_time = current_time + (
        expires_delta
        if expires_delta is not None
        else timedelta(
            minutes=(
                settings.access_token_expire_minutes
            )
        )
    )

    token_payload = {
        "sub": subject,
        "iat": current_time,
        "exp": expiration_time,
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
    }

    return jwt.encode(
        token_payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(
    token: str,
) -> str:
    token_payload = jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[
            settings.jwt_algorithm,
        ],
        issuer=settings.jwt_issuer,
        audience=settings.jwt_audience,
        options={
            "require": [
                "sub",
                "iat",
                "exp",
                "iss",
                "aud",
            ],
        },
    )

    subject = token_payload.get("sub")

    if (
        not isinstance(subject, str)
        or not subject
    ):
        raise InvalidTokenError(
            "The token subject is missing."
        )

    return subject