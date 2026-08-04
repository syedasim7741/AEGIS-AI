from getpass import getpass

from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError

from app.db.session import SessionLocal
from app.models.user import (
    UserRole,
    UserStatus,
)
from app.schemas.user import UserCreate
from app.services.user_service import (
    UserAlreadyExistsError,
    create_user,
)


def main() -> None:
    print()
    print(
        "AEGIS AI — Create Administrator"
    )
    print(
        "--------------------------------"
    )

    full_name = input(
        "Full name: "
    ).strip()

    email = input(
        "Email address: "
    ).strip()

    department = input(
        "Department "
        "[Platform Administration]: "
    ).strip()

    if not department:
        department = (
            "Platform Administration"
        )

    password = getpass(
        "Password: "
    )

    confirm_password = getpass(
        "Confirm password: "
    )

    if password != confirm_password:
        print()
        print(
            "Error: Passwords do not match."
        )
        return

    try:
        administrator_data = UserCreate(
            full_name=full_name,
            email=email,
            password=password,
            role=UserRole.ADMINISTRATOR,
            department=department,
            status=UserStatus.ACTIVE,
        )

    except ValidationError as error:
        print()
        print(
            "The administrator information "
            "is invalid:"
        )
        print(error)
        return

    database_session = SessionLocal()

    try:
        administrator = create_user(
            database_session,
            administrator_data,
        )

        print()
        print(
            "Administrator created successfully."
        )
        print(
            f"User ID: {administrator.id}"
        )
        print(
            f"Name: {administrator.full_name}"
        )
        print(
            f"Email: {administrator.email}"
        )
        print(
            f"Role: {administrator.role.value}"
        )
        print(
            f"Status: {administrator.status.value}"
        )

    except UserAlreadyExistsError as error:
        database_session.rollback()

        print()
        print(f"Error: {error}")

    except SQLAlchemyError:
        database_session.rollback()

        print()
        print(
            "Database error: The administrator "
            "could not be created."
        )

    finally:
        database_session.close()


if __name__ == "__main__":
    main()