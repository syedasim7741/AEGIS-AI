import math
import random
from datetime import (
    datetime,
    timedelta,
    timezone,
)

from sqlalchemy import (
    delete,
    select,
)

from app.db.session import SessionLocal
from app.models.machine import Machine
from app.models.machine_telemetry import (
    MachineTelemetryReading,
)
from app.models.robot import Robot
from app.models.robot_telemetry import (
    RobotTelemetryReading,
)


HISTORY_HOURS = 24
SEED_SOURCE = "seed"


def clamp(
    value: float,
    minimum: float,
    maximum: float,
) -> float:
    return max(
        minimum,
        min(maximum, value),
    )


def get_machine_status(
    health_score: float,
    temperature_celsius: float,
    vibration_mm_s: float,
) -> str:
    if health_score < 55:
        return "Critical"

    if (
        temperature_celsius > 88
        or vibration_mm_s > 8
        or health_score < 75
    ):
        return "Warning"

    return "Operational"


def get_robot_status(
    health_score: float,
    utilization_percent: float,
    battery_level_percent: float,
    temperature_celsius: float,
) -> str:
    if health_score < 55:
        return "Error"

    if battery_level_percent < 15:
        return "Offline"

    if (
        temperature_celsius > 80
        or health_score < 75
    ):
        return "Warning"

    if utilization_percent < 10:
        return "Idle"

    return "Active"


def seed_machine_history(
    database_session,
    machines: list[Machine],
    random_generator: random.Random,
    now: datetime,
) -> int:
    readings_created = 0

    for machine_index, machine in enumerate(
        machines,
    ):
        base_health = machine.health_score

        base_temperature = (
            machine.temperature_celsius
            if machine.temperature_celsius
            is not None
            else 45.0
        )

        base_vibration = (
            machine.vibration_mm_s
            if machine.vibration_mm_s
            is not None
            else 2.0
        )

        base_power = (
            machine.power_consumption_kw
            if machine.power_consumption_kw
            is not None
            else 25.0
        )

        for hour_index in range(
            HISTORY_HOURS,
        ):
            hours_ago = (
                HISTORY_HOURS
                - hour_index
                - 1
            )

            recorded_at = (
                now
                - timedelta(
                    hours=hours_ago,
                )
            )

            cycle = math.sin(
                (
                    hour_index
                    + machine_index
                )
                / 3
            )

            health_score = clamp(
                base_health
                + cycle * 3.5
                + random_generator.uniform(
                    -1.5,
                    1.5,
                ),
                0,
                100,
            )

            temperature_celsius = clamp(
                base_temperature
                + cycle * 4
                + random_generator.uniform(
                    -1.5,
                    1.5,
                ),
                -100,
                500,
            )

            vibration_mm_s = max(
                0,
                base_vibration
                + cycle * 0.8
                + random_generator.uniform(
                    -0.3,
                    0.3,
                ),
            )

            power_consumption_kw = max(
                0,
                base_power
                + cycle * 5
                + random_generator.uniform(
                    -2,
                    2,
                ),
            )

            status = get_machine_status(
                health_score,
                temperature_celsius,
                vibration_mm_s,
            )

            reading = (
                MachineTelemetryReading(
                    machine_id=machine.id,
                    status=status,
                    health_score=round(
                        health_score,
                        2,
                    ),
                    temperature_celsius=round(
                        temperature_celsius,
                        2,
                    ),
                    vibration_mm_s=round(
                        vibration_mm_s,
                        2,
                    ),
                    power_consumption_kw=round(
                        power_consumption_kw,
                        2,
                    ),
                    source=SEED_SOURCE,
                    recorded_at=recorded_at,
                )
            )

            database_session.add(
                reading,
            )

            readings_created += 1

    return readings_created


def seed_robot_history(
    database_session,
    robots: list[Robot],
    random_generator: random.Random,
    now: datetime,
) -> int:
    readings_created = 0

    for robot_index, robot in enumerate(
        robots,
    ):
        base_health = robot.health_score

        base_utilization = (
            robot.utilization_percent
        )

        base_battery = (
            robot.battery_level_percent
            if robot.battery_level_percent
            is not None
            else 100.0
        )

        base_temperature = (
            robot.temperature_celsius
            if robot.temperature_celsius
            is not None
            else 40.0
        )

        for hour_index in range(
            HISTORY_HOURS,
        ):
            hours_ago = (
                HISTORY_HOURS
                - hour_index
                - 1
            )

            recorded_at = (
                now
                - timedelta(
                    hours=hours_ago,
                )
            )

            cycle = math.sin(
                (
                    hour_index
                    + robot_index
                )
                / 3
            )

            health_score = clamp(
                base_health
                + cycle * 3
                + random_generator.uniform(
                    -1.5,
                    1.5,
                ),
                0,
                100,
            )

            utilization_percent = clamp(
                base_utilization
                + cycle * 12
                + random_generator.uniform(
                    -5,
                    5,
                ),
                0,
                100,
            )

            battery_level_percent = clamp(
                base_battery
                - hour_index * 0.7
                + cycle * 3
                + random_generator.uniform(
                    -1,
                    1,
                ),
                0,
                100,
            )

            temperature_celsius = clamp(
                base_temperature
                + (
                    utilization_percent
                    / 100
                    * 12
                )
                + random_generator.uniform(
                    -1.5,
                    1.5,
                ),
                -100,
                500,
            )

            status = get_robot_status(
                health_score,
                utilization_percent,
                battery_level_percent,
                temperature_celsius,
            )

            reading = (
                RobotTelemetryReading(
                    robot_id=robot.id,
                    status=status,
                    current_task=(
                        robot.current_task
                    ),
                    health_score=round(
                        health_score,
                        2,
                    ),
                    utilization_percent=round(
                        utilization_percent,
                        2,
                    ),
                    battery_level_percent=round(
                        battery_level_percent,
                        2,
                    ),
                    payload_kg=robot.payload_kg,
                    temperature_celsius=round(
                        temperature_celsius,
                        2,
                    ),
                    position_x=robot.position_x,
                    position_y=robot.position_y,
                    position_z=robot.position_z,
                    error_code=(
                        robot.error_code
                        if status == "Error"
                        else None
                    ),
                    source=SEED_SOURCE,
                    recorded_at=recorded_at,
                )
            )

            database_session.add(
                reading,
            )

            readings_created += 1

    return readings_created


def main() -> None:
    database_session = SessionLocal()

    try:
        machines = list(
            database_session.scalars(
                select(Machine).order_by(
                    Machine.asset_code,
                )
            ).all()
        )

        robots = list(
            database_session.scalars(
                select(Robot).order_by(
                    Robot.robot_code,
                )
            ).all()
        )

        if not machines:
            raise RuntimeError(
                "No machines were found. "
                "Seed machines first.",
            )

        if not robots:
            raise RuntimeError(
                "No robots were found. "
                "Seed robots first.",
            )

        database_session.execute(
            delete(
                MachineTelemetryReading
            ).where(
                MachineTelemetryReading.source
                == SEED_SOURCE
            )
        )

        database_session.execute(
            delete(
                RobotTelemetryReading
            ).where(
                RobotTelemetryReading.source
                == SEED_SOURCE
            )
        )

        random_generator = (
            random.Random(42)
        )

        now = datetime.now(
            timezone.utc,
        ).replace(
            minute=0,
            second=0,
            microsecond=0,
        )

        machine_count = (
            seed_machine_history(
                database_session,
                machines,
                random_generator,
                now,
            )
        )

        robot_count = (
            seed_robot_history(
                database_session,
                robots,
                random_generator,
                now,
            )
        )

        database_session.commit()

        print(
            "Telemetry history seeded "
            "successfully."
        )

        print(
            f"Machines: {len(machines)}"
        )

        print(
            "Machine readings: "
            f"{machine_count}"
        )

        print(
            f"Robots: {len(robots)}"
        )

        print(
            "Robot readings: "
            f"{robot_count}"
        )

    except Exception:
        database_session.rollback()
        raise

    finally:
        database_session.close()


if __name__ == "__main__":
    main()