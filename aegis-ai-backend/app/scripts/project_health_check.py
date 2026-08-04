from collections.abc import Callable

from sqlalchemy import inspect, text
from sqlalchemy.engine import Connection

from app.db.session import engine
from app.main import app


REQUIRED_TABLES = {
    "users",
    "machines",
    "robots",
    "machine_telemetry_readings",
    "robot_telemetry_readings",
    "maintenance_work_orders",
}


REQUIRED_API_PATHS = {
    "/api/v1/machines",
    "/api/v1/robots",
    "/api/v1/predictive-maintenance/assessments",
    "/api/v1/predictive-maintenance/summary",
    "/api/v1/maintenance-work-orders",
    "/api/v1/maintenance-work-orders/summary",
    "/api/v1/maintenance-work-orders/{work_order_id}",
    "/api/v1/maintenance-work-orders/{work_order_id}/status",
}


TABLE_COUNT_QUERIES = {
    "Users": "SELECT COUNT(*) FROM users",
    "Machines": "SELECT COUNT(*) FROM machines",
    "Robots": "SELECT COUNT(*) FROM robots",
    "Machine telemetry readings": (
        "SELECT COUNT(*) "
        "FROM machine_telemetry_readings"
    ),
    "Robot telemetry readings": (
        "SELECT COUNT(*) "
        "FROM robot_telemetry_readings"
    ),
    "Maintenance work orders": (
        "SELECT COUNT(*) "
        "FROM maintenance_work_orders"
    ),
}


def print_result(
    name: str,
    passed: bool,
    details: str = "",
) -> None:
    status = "PASS" if passed else "FAIL"

    message = f"[{status}] {name}"

    if details:
        message += f": {details}"

    print(message)


def run_check(
    name: str,
    check_function: Callable[[], str],
    failures: list[str],
) -> None:
    try:
        details = check_function()

        print_result(
            name,
            True,
            details,
        )

    except Exception as error:
        failures.append(
            f"{name}: {error}"
        )

        print_result(
            name,
            False,
            str(error),
        )


def check_database_connection() -> str:
    with engine.connect() as connection:
        result = connection.execute(
            text("SELECT 1")
        ).scalar_one()

    if result != 1:
        raise RuntimeError(
            "PostgreSQL returned an "
            "unexpected result."
        )

    return "PostgreSQL connection successful"


def check_required_tables() -> str:
    inspector = inspect(engine)

    existing_tables = set(
        inspector.get_table_names()
    )

    missing_tables = (
        REQUIRED_TABLES
        - existing_tables
    )

    if missing_tables:
        raise RuntimeError(
            "Missing tables: "
            + ", ".join(
                sorted(
                    missing_tables
                )
            )
        )

    return (
        f"{len(REQUIRED_TABLES)} "
        "required tables found"
    )


def read_table_counts(
    connection: Connection,
) -> list[str]:
    results: list[str] = []

    for label, query in (
        TABLE_COUNT_QUERIES.items()
    ):
        count = connection.execute(
            text(query)
        ).scalar_one()

        results.append(
            f"{label}={count}"
        )

    return results


def check_seeded_data() -> str:
    with engine.connect() as connection:
        results = read_table_counts(
            connection
        )

        machine_count = (
            connection.execute(
                text(
                    "SELECT COUNT(*) "
                    "FROM machines"
                )
            ).scalar_one()
        )

        robot_count = (
            connection.execute(
                text(
                    "SELECT COUNT(*) "
                    "FROM robots"
                )
            ).scalar_one()
        )

        work_order_count = (
            connection.execute(
                text(
                    "SELECT COUNT(*) "
                    "FROM maintenance_work_orders"
                )
            ).scalar_one()
        )

    if machine_count < 1:
        raise RuntimeError(
            "No machines found."
        )

    if robot_count < 1:
        raise RuntimeError(
            "No robots found."
        )

    if work_order_count < 1:
        raise RuntimeError(
            "No maintenance work "
            "orders found."
        )

    return ", ".join(results)


def check_openapi_paths() -> str:
    openapi_document = app.openapi()

    available_paths = set(
        openapi_document.get(
            "paths",
            {},
        )
    )

    missing_paths = (
        REQUIRED_API_PATHS
        - available_paths
    )

    if missing_paths:
        raise RuntimeError(
            "Missing API paths: "
            + ", ".join(
                sorted(
                    missing_paths
                )
            )
        )

    return (
        f"{len(REQUIRED_API_PATHS)} "
        "required API paths found"
    )


def check_work_order_foreign_key() -> str:
    inspector = inspect(engine)

    foreign_keys = (
        inspector.get_foreign_keys(
            "maintenance_work_orders"
        )
    )

    machine_foreign_key_found = any(
        foreign_key.get(
            "referred_table"
        )
        == "machines"
        and foreign_key.get(
            "referred_columns"
        )
        == ["id"]
        for foreign_key in foreign_keys
    )

    if not machine_foreign_key_found:
        raise RuntimeError(
            "Machine foreign key "
            "was not found."
        )

    return (
        "maintenance_work_orders "
        "references machines.id"
    )


def main() -> None:
    failures: list[str] = []

    print()
    print("=" * 62)
    print(
        "AEGIS AI PROJECT HEALTH CHECK"
    )
    print("=" * 62)

    run_check(
        "Database connection",
        check_database_connection,
        failures,
    )

    run_check(
        "Required database tables",
        check_required_tables,
        failures,
    )

    run_check(
        "Seeded application data",
        check_seeded_data,
        failures,
    )

    run_check(
        "Required API routes",
        check_openapi_paths,
        failures,
    )

    run_check(
        "Work-order foreign key",
        check_work_order_foreign_key,
        failures,
    )

    print("=" * 62)

    if failures:
        print(
            "PROJECT HEALTH CHECK FAILED"
        )

        for failure in failures:
            print(
                f"- {failure}"
            )

        print("=" * 62)

        raise SystemExit(1)

    print(
        "PROJECT HEALTH CHECK PASSED"
    )
    print(
        "AEGIS AI core systems are healthy."
    )
    print("=" * 62)
    print()


if __name__ == "__main__":
    main()