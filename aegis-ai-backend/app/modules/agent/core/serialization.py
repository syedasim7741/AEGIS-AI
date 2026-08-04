from collections.abc import Mapping
from datetime import date, datetime
from enum import Enum
from typing import Any
from uuid import UUID

from pydantic import BaseModel


def to_json_safe(value: Any) -> Any:
    """
    Convert application objects into JSON-safe values
    without exposing SQLAlchemy internal attributes.
    """

    if value is None:
        return None

    if isinstance(
        value,
        (str, int, float, bool),
    ):
        return value

    if isinstance(value, UUID):
        return str(value)

    if isinstance(value, (datetime, date)):
        return value.isoformat()

    if isinstance(value, Enum):
        return value.value

    if isinstance(value, BaseModel):
        return to_json_safe(
            value.model_dump(
                mode="python",
            )
        )

    if isinstance(value, Mapping):
        return {
            str(key): to_json_safe(item)
            for key, item in value.items()
        }

    if isinstance(value, (list, tuple, set)):
        return [
            to_json_safe(item)
            for item in value
        ]

    table = getattr(value, "__table__", None)

    if table is not None:
        return {
            column.name: to_json_safe(
                getattr(value, column.name)
            )
            for column in table.columns
        }

    return str(value)
