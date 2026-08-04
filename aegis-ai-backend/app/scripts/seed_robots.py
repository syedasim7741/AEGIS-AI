from datetime import (
    datetime,
    timedelta,
    timezone,
)

from app.db.session import SessionLocal
from app.models.robot import (
    RobotStatus,
    RobotType,
)
from app.repositories.robot import (
    get_robot_by_code,
)
from app.schemas.robot import (
    RobotCreate,
)
from app.services.robot_service import (
    create_robot_record,
)


def create_sample_robots() -> None:
    current_time = datetime.now(
        timezone.utc
    )

    sample_robots = [
        RobotCreate(
            name="Welding Cell Robot 01",
            robot_code="ROB-WELD-001",
            robot_type=RobotType.WELDING,
            status=RobotStatus.ACTIVE,
            facility="Dammam Smart Factory",
            production_line="Automotive Welding Cell",
            manufacturer="ABB",
            model_number="IRB-2600",
            current_task=(
                "Welding vehicle chassis"
            ),
            health_score=96.2,
            utilization_percent=87.5,
            battery_level_percent=None,
            payload_kg=20.0,
            temperature_celsius=51.4,
            position_x=12.4,
            position_y=4.8,
            position_z=2.1,
            error_code=None,
            last_maintenance_at=(
                current_time -
                timedelta(days=18)
            ),
            next_maintenance_at=(
                current_time +
                timedelta(days=42)
            ),
            last_seen_at=current_time,
        ),
        RobotCreate(
            name="Collaborative Assembly Robot 02",
            robot_code="ROB-COBOT-002",
            robot_type=RobotType.COBOT,
            status=RobotStatus.IDLE,
            facility="Dammam Smart Factory",
            production_line="Assembly Line A",
            manufacturer="Universal Robots",
            model_number="UR10e",
            current_task=(
                "Waiting for assembly batch"
            ),
            health_score=91.8,
            utilization_percent=48.3,
            battery_level_percent=None,
            payload_kg=10.0,
            temperature_celsius=38.7,
            position_x=7.1,
            position_y=3.4,
            position_z=1.6,
            error_code=None,
            last_maintenance_at=(
                current_time -
                timedelta(days=25)
            ),
            next_maintenance_at=(
                current_time +
                timedelta(days=35)
            ),
            last_seen_at=current_time,
        ),
        RobotCreate(
            name="Autonomous Logistics Robot 03",
            robot_code="ROB-AMR-003",
            robot_type=RobotType.MOBILE,
            status=RobotStatus.WARNING,
            facility="Riyadh Distribution Hub",
            production_line="Warehouse Logistics",
            manufacturer="Mobile Industrial Robots",
            model_number="MiR250",
            current_task=(
                "Transporting component pallets"
            ),
            health_score=73.5,
            utilization_percent=78.2,
            battery_level_percent=22.0,
            payload_kg=250.0,
            temperature_celsius=44.6,
            position_x=38.2,
            position_y=16.5,
            position_z=0.0,
            error_code="LOW-BATTERY-022",
            last_maintenance_at=(
                current_time -
                timedelta(days=40)
            ),
            next_maintenance_at=(
                current_time +
                timedelta(days=8)
            ),
            last_seen_at=current_time,
        ),
        RobotCreate(
            name="Vision Inspection Robot 04",
            robot_code="ROB-INSP-004",
            robot_type=RobotType.INSPECTION,
            status=RobotStatus.ERROR,
            facility="Jubail Processing Plant",
            production_line="Quality Inspection",
            manufacturer="FANUC",
            model_number="CRX-10iA",
            current_task=(
                "Inspection process stopped"
            ),
            health_score=44.7,
            utilization_percent=12.5,
            battery_level_percent=None,
            payload_kg=10.0,
            temperature_celsius=67.8,
            position_x=5.7,
            position_y=9.3,
            position_z=2.4,
            error_code="CAM-ALIGN-004",
            last_maintenance_at=(
                current_time -
                timedelta(days=82)
            ),
            next_maintenance_at=(
                current_time -
                timedelta(days=3)
            ),
            last_seen_at=current_time,
        ),
        RobotCreate(
            name="Palletizing Robot 05",
            robot_code="ROB-PALL-005",
            robot_type=RobotType.PALLETIZING,
            status=RobotStatus.MAINTENANCE,
            facility="Riyadh Distribution Hub",
            production_line="Packaging Line B",
            manufacturer="KUKA",
            model_number="KR-QUANTEC-PA",
            current_task=(
                "Scheduled maintenance"
            ),
            health_score=66.4,
            utilization_percent=0.0,
            battery_level_percent=None,
            payload_kg=240.0,
            temperature_celsius=29.5,
            position_x=14.2,
            position_y=6.9,
            position_z=1.8,
            error_code=None,
            last_maintenance_at=current_time,
            next_maintenance_at=(
                current_time +
                timedelta(days=90)
            ),
            last_seen_at=current_time,
        ),
        RobotCreate(
            name="SCARA Packaging Robot 06",
            robot_code="ROB-SCARA-006",
            robot_type=RobotType.SCARA,
            status=RobotStatus.OFFLINE,
            facility="Jubail Processing Plant",
            production_line="Packaging Line C",
            manufacturer="Epson",
            model_number="T6-602S",
            current_task=None,
            health_score=58.1,
            utilization_percent=0.0,
            battery_level_percent=None,
            payload_kg=6.0,
            temperature_celsius=None,
            position_x=3.6,
            position_y=2.8,
            position_z=1.2,
            error_code="NETWORK-OFFLINE",
            last_maintenance_at=(
                current_time -
                timedelta(days=61)
            ),
            next_maintenance_at=(
                current_time +
                timedelta(days=19)
            ),
            last_seen_at=(
                current_time -
                timedelta(hours=5)
            ),
        ),
    ]

    database_session = SessionLocal()

    created_count = 0
    skipped_count = 0

    try:
        for payload in sample_robots:
            existing_robot = (
                get_robot_by_code(
                    database_session,
                    payload.robot_code,
                )
            )

            if existing_robot is not None:
                print(
                    "Skipped existing robot:",
                    payload.robot_code,
                )

                skipped_count += 1
                continue

            robot = create_robot_record(
                database_session,
                payload=payload,
            )

            print(
                "Created robot:",
                robot.robot_code,
                "-",
                robot.name,
            )

            created_count += 1

        print()
        print("Robot seed completed.")
        print("Created:", created_count)
        print("Skipped:", skipped_count)

    finally:
        database_session.close()


if __name__ == "__main__":
    create_sample_robots()