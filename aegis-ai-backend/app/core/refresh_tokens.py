from datetime import (
    datetime,
    timedelta,
    timezone,
)
from hashlib import sha256
from secrets import token_urlsafe


REFRESH_TOKEN_RANDOM_BYTES = 32


def generate_refresh_token() -> str:
    """
    Create a cryptographically secure,
    URL-safe refresh token.
    """
    return token_urlsafe(
        REFRESH_TOKEN_RANDOM_BYTES
    )


def hash_refresh_token(
    refresh_token: str,
) -> str:
    """
    Create the SHA-256 hash stored
    in PostgreSQL.
    """
    cleaned_token = (
        refresh_token.strip()
    )

    if not cleaned_token:
        raise ValueError(
            "Refresh token cannot be empty."
        )

    return sha256(
        cleaned_token.encode("utf-8")
    ).hexdigest()


def create_refresh_expiration(
    lifetime_days: int,
) -> datetime:
    """
    Return the UTC expiration date
    for a refresh session.
    """
    if lifetime_days <= 0:
        raise ValueError(
            "Refresh-token lifetime "
            "must be greater than zero."
        )

    return datetime.now(
        timezone.utc
    ) + timedelta(
        days=lifetime_days
    )


def is_refresh_session_expired(
    expires_at: datetime,
) -> bool:
    """
    Check whether a refresh session
    has passed its expiration date.
    """
    expiration = expires_at

    if expiration.tzinfo is None:
        expiration = (
            expiration.replace(
                tzinfo=timezone.utc
            )
        )

    return expiration <= datetime.now(
        timezone.utc
    )