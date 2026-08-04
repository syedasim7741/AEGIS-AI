from datetime import datetime
from uuid import UUID

from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
    model_validator,
)

from app.models.user import (
    UserRole,
    UserStatus,
)


def clean_text(value: str) -> str:
    cleaned_value = " ".join(
        value.strip().split()
    )

    if not cleaned_value:
        raise ValueError(
            "This field cannot be empty."
        )

    return cleaned_value


def validate_password(value: str) -> str:
    if not any(
        character.isupper()
        for character in value
    ):
        raise ValueError(
            "Password must contain an uppercase letter."
        )

    if not any(
        character.islower()
        for character in value
    ):
        raise ValueError(
            "Password must contain a lowercase letter."
        )

    if not any(
        character.isdigit()
        for character in value
    ):
        raise ValueError(
            "Password must contain a number."
        )

    if not any(
        not character.isalnum()
        for character in value
    ):
        raise ValueError(
            "Password must contain a special character."
        )

    return value


class UserCreate(BaseModel):
    full_name: str = Field(
        min_length=2,
        max_length=150,
    )

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=128,
    )

    role: UserRole

    department: str = Field(
        min_length=2,
        max_length=150,
    )

    status: UserStatus = UserStatus.ACTIVE

    @field_validator(
        "full_name",
        "department",
    )
    @classmethod
    def clean_required_text(
        cls,
        value: str,
    ) -> str:
        return clean_text(value)

    @field_validator("email")
    @classmethod
    def normalize_email(
        cls,
        value: EmailStr,
    ) -> str:
        return str(value).strip().lower()

    @field_validator("password")
    @classmethod
    def check_password_strength(
        cls,
        value: str,
    ) -> str:
        return validate_password(value)


class UserUpdate(BaseModel):
    full_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    email: EmailStr | None = None

    role: UserRole | None = None

    department: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

    @field_validator(
        "full_name",
        "department",
    )
    @classmethod
    def clean_optional_text(
        cls,
        value: str | None,
    ) -> str | None:
        if value is None:
            return None

        return clean_text(value)

    @field_validator("email")
    @classmethod
    def normalize_optional_email(
        cls,
        value: EmailStr | None,
    ) -> str | None:
        if value is None:
            return None

        return str(value).strip().lower()

    @model_validator(mode="after")
    def require_update_field(
        self,
    ) -> "UserUpdate":
        if not self.model_fields_set:
            raise ValueError(
                "Provide at least one field to update."
            )

        return self


class UserStatusUpdate(BaseModel):
    status: UserStatus


class UserResponse(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: UUID
    full_name: str
    email: EmailStr
    role: UserRole
    department: str
    status: UserStatus
    created_at: datetime
    updated_at: datetime
    last_login_at: datetime | None


class UserListResponse(BaseModel):
    items: list[UserResponse]
    total: int
    offset: int
    limit: int