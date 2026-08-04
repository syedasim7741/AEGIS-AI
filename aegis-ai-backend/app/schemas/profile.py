from pydantic import (
    BaseModel,
    Field,
    field_validator,
    model_validator,
)

from app.schemas.user import (
    clean_text,
    validate_password,
)


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(
        default=None,
        min_length=2,
        max_length=150,
    )

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

    @model_validator(mode="after")
    def require_update_field(
        self,
    ) -> "ProfileUpdate":
        if not self.model_fields_set:
            raise ValueError(
                "Provide at least one profile field "
                "to update."
            )

        return self


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(
        min_length=1,
        max_length=128,
    )

    new_password: str = Field(
        min_length=8,
        max_length=128,
    )

    confirm_new_password: str = Field(
        min_length=8,
        max_length=128,
    )

    @field_validator("new_password")
    @classmethod
    def check_new_password_strength(
        cls,
        value: str,
    ) -> str:
        return validate_password(value)

    @model_validator(mode="after")
    def validate_password_change(
        self,
    ) -> "PasswordChangeRequest":
        if (
            self.new_password
            != self.confirm_new_password
        ):
            raise ValueError(
                "The new passwords do not match."
            )

        if (
            self.current_password
            == self.new_password
        ):
            raise ValueError(
                "The new password must be different "
                "from the current password."
            )

        return self


class PasswordChangeResponse(BaseModel):
    message: str