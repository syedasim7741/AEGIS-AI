from datetime import (
    datetime,
    timedelta,
    timezone,
)

from app.db.session import SessionLocal
from app.models.machine import (
    MachineStatus,
    MachineType,
)
from app.repositories.machine import (
    get_machine_by_asset_code,
)
from app.schemas.machine import (
    MachineCreate,
)
from app.services.machine_service import (
    create_machine_record,
)


def create_sample_machines() -> None:
    current_time = datetime.now(
        timezone.utc
    )

    sample_machines = [
        MachineCreate(
            name="CNC Milling Machine 01",
            asset_code="CNC-001",
            machine_type=MachineType.CNC,
            status=MachineStatus.OPERATIONAL,
            facility="Dammam Smart Factory",
            production_line="Precision Manufacturing",
            manufacturer="Haas Automation",
            model_number="VF-4SS",
            health_score=94.5,
            temperature_celsius=46.2,
            vibration_mm_s=1.7,
            power_consumption_kw=18.6,
            last_maintenance_at=(
                current_time -
                timedelta(days=20)
            ),
            next_maintenance_at=(
                current_time +
                timedelta(days=40)
            ),
            last_seen_at=current_time,
        ),
        MachineCreate(
            name="Industrial Conveyor 02",
            asset_code="CONV-002",
            machine_type=(
                MachineType.CONVEYOR
            ),
            status=MachineStatus.WARNING,
            facility="Dammam Smart Factory",
            production_line="Assembly Line A",
            manufacturer="Siemens",
            model_number="SIMATIC-CONV-200",
            health_score=76.8,
            temperature_celsius=55.7,
            vibration_mm_s=4.6,
            power_consumption_kw=12.4,
            last_maintenance_at=(
                current_time -
                timedelta(days=50)
            ),
            next_maintenance_at=(
                current_time +
                timedelta(days=10)
            ),
            last_seen_at=current_time,
        ),
        MachineCreate(
            name="Hydraulic Pump 03",
            asset_code="PUMP-003",
            machine_type=MachineType.PUMP,
            status=MachineStatus.CRITICAL,
            facility="Jubail Processing Plant",
            production_line="Cooling System",
            manufacturer="Grundfos",
            model_number="CR-95",
            health_score=41.3,
            temperature_celsius=88.4,
            vibration_mm_s=9.8,
            power_consumption_kw=31.2,
            last_maintenance_at=(
                current_time -
                timedelta(days=95)
            ),
            next_maintenance_at=(
                current_time -
                timedelta(days=5)
            ),
            last_seen_at=current_time,
        ),
        MachineCreate(
            name="Air Compressor 04",
            asset_code="COMP-004",
            machine_type=(
                MachineType.COMPRESSOR
            ),
            status=MachineStatus.MAINTENANCE,
            facility="Jubail Processing Plant",
            production_line="Utility Section",
            manufacturer="Atlas Copco",
            model_number="GA-90",
            health_score=68.0,
            temperature_celsius=34.5,
            vibration_mm_s=2.1,
            power_consumption_kw=0,
            last_maintenance_at=current_time,
            next_maintenance_at=(
                current_time +
                timedelta(days=90)
            ),
            last_seen_at=current_time,
        ),
        MachineCreate(
            name="Packaging Machine 05",
            asset_code="PACK-005",
            machine_type=(
                MachineType.PACKAGING
            ),
            status=MachineStatus.OFFLINE,
            facility="Riyadh Distribution Hub",
            production_line="Packaging Line B",
            manufacturer="Krones",
            model_number="PackMaster-X5",
            health_score=59.7,
            temperature_celsius=None,
            vibration_mm_s=None,
            power_consumption_kw=0,
            last_maintenance_at=(
                current_time -
                timedelta(days=65)
            ),
            next_maintenance_at=(
                current_time +
                timedelta(days=25)
            ),
            last_seen_at=(
                current_time -
                timedelta(hours=4)
            ),
        ),
    ]

    database_session = SessionLocal()

    created_count = 0
    skipped_count = 0

    try:
        for payload in sample_machines:
            existing_machine = (
                get_machine_by_asset_code(
                    database_session,
                    payload.asset_code,
                )
            )

            if existing_machine is not None:
                print(
                    "Skipped existing machine:",
                    payload.asset_code,
                )

                skipped_count += 1
                continue

            machine = create_machine_record(
                database_session,
                payload=payload,
            )

            print(
                "Created machine:",
                machine.asset_code,
                "-",
                machine.name,
            )

            created_count += 1

        print()
        print(
            "Machine seed completed."
        )
        print(
            "Created:",
            created_count,
        )
        print(
            "Skipped:",
            skipped_count,
        )

    finally:
        database_session.close()


if __name__ == "__main__":
    create_sample_machines()