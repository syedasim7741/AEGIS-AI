from datetime import (
    datetime,
    timezone,
)

from sqlalchemy import (
    select,
)
from sqlalchemy.orm import Session

from app.models.machine import (
    Machine,
    MachineStatus,
)
from app.models.machine_telemetry import (
    MachineTelemetryReading,
)
from app.schemas.predictive_maintenance import (
    PredictiveMaintenanceAssessment,
    PredictiveMaintenanceSummary,
    PredictiveRiskLevel,
)


TELEMETRY_HISTORY_LIMIT = 24


def clamp(
    value: float,
    minimum: float,
    maximum: float,
) -> float:
    return max(
        minimum,
        min(
            maximum,
            value,
        ),
    )


def get_machine_telemetry_history(
    database_session: Session,
    machine_id,
) -> list[MachineTelemetryReading]:
    statement = (
        select(
            MachineTelemetryReading
        )
        .where(
            MachineTelemetryReading.machine_id
            == machine_id
        )
        .order_by(
            MachineTelemetryReading.recorded_at.desc()
        )
        .limit(
            TELEMETRY_HISTORY_LIMIT
        )
    )

    readings = list(
        database_session.scalars(
            statement
        ).all()
    )

    readings.reverse()

    return readings


def calculate_change(
    first_value: float | None,
    latest_value: float | None,
) -> float:
    if (
        first_value is None
        or latest_value is None
    ):
        return 0.0

    return latest_value - first_value


def count_machine_anomalies(
    readings: list[
        MachineTelemetryReading
    ],
) -> int:
    anomaly_count = 0

    for reading in readings:
        has_anomaly = (
            reading.health_score < 75
            or (
                reading.temperature_celsius
                is not None
                and reading.temperature_celsius
                >= 75
            )
            or (
                reading.vibration_mm_s
                is not None
                and reading.vibration_mm_s
                >= 5
            )
            or reading.status
            in {
                "Warning",
                "Critical",
                "Offline",
            }
        )

        if has_anomaly:
            anomaly_count += 1

    return anomaly_count


def calculate_power_change_percent(
    readings: list[
        MachineTelemetryReading
    ],
) -> float:
    power_readings = [
        reading.power_consumption_kw
        for reading in readings
        if reading.power_consumption_kw
        is not None
    ]

    if len(power_readings) < 2:
        return 0.0

    first_power = power_readings[0]
    latest_power = power_readings[-1]

    if first_power == 0:
        return 0.0

    return (
        (
            latest_power
            - first_power
        )
        / first_power
        * 100
    )


def get_risk_level(
    risk_score: float,
) -> PredictiveRiskLevel:
    if risk_score >= 75:
        return (
            PredictiveRiskLevel.CRITICAL
        )

    if risk_score >= 50:
        return (
            PredictiveRiskLevel.HIGH
        )

    if risk_score >= 25:
        return (
            PredictiveRiskLevel.MEDIUM
        )

    return PredictiveRiskLevel.LOW


def get_recommended_action(
    risk_level: PredictiveRiskLevel,
    risk_factors: list[str],
) -> str:
    if (
        risk_level
        == PredictiveRiskLevel.CRITICAL
    ):
        return (
            "Stop the machine safely and "
            "perform an immediate engineering "
            "inspection before restarting."
        )

    if (
        risk_level
        == PredictiveRiskLevel.HIGH
    ):
        return (
            "Schedule maintenance within 24 hours "
            "and investigate the identified risk "
            "factors."
        )

    if (
        risk_level
        == PredictiveRiskLevel.MEDIUM
    ):
        return (
            "Inspect the machine during the next "
            "planned maintenance window and "
            "increase telemetry monitoring."
        )

    if risk_factors:
        return (
            "Continue normal operation while "
            "monitoring the identified early "
            "warning indicators."
        )

    return (
        "Continue normal operation and routine "
        "preventive-maintenance monitoring."
    )


def build_machine_assessment(
    machine: Machine,
    readings: list[
        MachineTelemetryReading
    ],
) -> PredictiveMaintenanceAssessment:
    latest_reading = (
        readings[-1]
        if readings
        else None
    )

    first_reading = (
        readings[0]
        if readings
        else None
    )

    health_score = (
        latest_reading.health_score
        if latest_reading
        else machine.health_score
    )

    temperature_celsius = (
        latest_reading.temperature_celsius
        if latest_reading
        else machine.temperature_celsius
    )

    vibration_mm_s = (
        latest_reading.vibration_mm_s
        if latest_reading
        else machine.vibration_mm_s
    )

    power_consumption_kw = (
        latest_reading.power_consumption_kw
        if latest_reading
        else machine.power_consumption_kw
    )

    health_trend = calculate_change(
        (
            first_reading.health_score
            if first_reading
            else health_score
        ),
        health_score,
    )

    temperature_trend = calculate_change(
        (
            first_reading.temperature_celsius
            if first_reading
            else temperature_celsius
        ),
        temperature_celsius,
    )

    vibration_trend = calculate_change(
        (
            first_reading.vibration_mm_s
            if first_reading
            else vibration_mm_s
        ),
        vibration_mm_s,
    )

    power_change_percent = (
        calculate_power_change_percent(
            readings
        )
    )

    anomaly_count = (
        count_machine_anomalies(
            readings
        )
    )

    risk_score = 0.0
    risk_factors: list[str] = []

    if health_score < 50:
        risk_score += 40

        risk_factors.append(
            "Machine health is below 50%."
        )

    elif health_score < 70:
        risk_score += 28

        risk_factors.append(
            "Machine health is below 70%."
        )

    elif health_score < 85:
        risk_score += 15

        risk_factors.append(
            "Machine health is declining."
        )

    if temperature_celsius is not None:
        if temperature_celsius >= 90:
            risk_score += 22

            risk_factors.append(
                "Temperature is critically high."
            )

        elif temperature_celsius >= 75:
            risk_score += 14

            risk_factors.append(
                "Temperature is above the "
                "recommended operating range."
            )

        elif temperature_celsius >= 60:
            risk_score += 7

            risk_factors.append(
                "Temperature is elevated."
            )

    if vibration_mm_s is not None:
        if vibration_mm_s >= 8:
            risk_score += 22

            risk_factors.append(
                "Vibration is at a critical level."
            )

        elif vibration_mm_s >= 5:
            risk_score += 14

            risk_factors.append(
                "Vibration is above the "
                "recommended operating range."
            )

        elif vibration_mm_s >= 3.5:
            risk_score += 7

            risk_factors.append(
                "Vibration is elevated."
            )

    if (
        machine.status
        == MachineStatus.CRITICAL
    ):
        risk_score += 25

        risk_factors.append(
            "The current machine status is "
            "Critical."
        )

    elif (
        machine.status
        == MachineStatus.OFFLINE
    ):
        risk_score += 18

        risk_factors.append(
            "The machine is currently offline."
        )

    elif (
        machine.status
        == MachineStatus.WARNING
    ):
        risk_score += 12

        risk_factors.append(
            "The current machine status contains "
            "a warning."
        )

    elif (
        machine.status
        == MachineStatus.MAINTENANCE
    ):
        risk_score += 8

        risk_factors.append(
            "The machine is currently under "
            "maintenance."
        )

    if health_trend <= -10:
        risk_score += 15

        risk_factors.append(
            "Health declined by at least 10 points "
            "during the telemetry period."
        )

    elif health_trend <= -5:
        risk_score += 8

        risk_factors.append(
            "Health declined during the telemetry "
            "period."
        )

    if temperature_trend >= 10:
        risk_score += 10

        risk_factors.append(
            "Temperature increased significantly "
            "during the telemetry period."
        )

    elif temperature_trend >= 5:
        risk_score += 5

        risk_factors.append(
            "Temperature is trending upward."
        )

    if vibration_trend >= 2:
        risk_score += 10

        risk_factors.append(
            "Vibration increased significantly "
            "during the telemetry period."
        )

    elif vibration_trend >= 1:
        risk_score += 5

        risk_factors.append(
            "Vibration is trending upward."
        )

    if power_change_percent >= 20:
        risk_score += 10

        risk_factors.append(
            "Power consumption increased by at "
            "least 20%."
        )

    elif power_change_percent >= 10:
        risk_score += 5

        risk_factors.append(
            "Power consumption is trending upward."
        )

    risk_score += min(
        anomaly_count * 1.5,
        12,
    )

    if anomaly_count >= 6:
        risk_factors.append(
            "Multiple anomalous telemetry readings "
            "were detected."
        )

    risk_score = round(
        clamp(
            risk_score,
            0,
            100,
        ),
        2,
    )

    risk_level = get_risk_level(
        risk_score
    )

    return (
        PredictiveMaintenanceAssessment(
            machine_id=machine.id,
            machine_name=machine.name,
            asset_code=machine.asset_code,
            facility=machine.facility,
            production_line=(
                machine.production_line
            ),
            risk_score=risk_score,
            risk_level=risk_level,
            current_status=(
                machine.status.value
            ),
            health_score=round(
                health_score,
                2,
            ),
            temperature_celsius=(
                round(
                    temperature_celsius,
                    2,
                )
                if temperature_celsius
                is not None
                else None
            ),
            vibration_mm_s=(
                round(
                    vibration_mm_s,
                    2,
                )
                if vibration_mm_s
                is not None
                else None
            ),
            power_consumption_kw=(
                round(
                    power_consumption_kw,
                    2,
                )
                if power_consumption_kw
                is not None
                else None
            ),
            health_trend_percent=round(
                health_trend,
                2,
            ),
            temperature_trend_celsius=round(
                temperature_trend,
                2,
            ),
            vibration_trend_mm_s=round(
                vibration_trend,
                2,
            ),
            anomaly_count=anomaly_count,
            telemetry_reading_count=len(
                readings
            ),
            risk_factors=risk_factors,
            recommended_action=(
                get_recommended_action(
                    risk_level,
                    risk_factors,
                )
            ),
            assessed_at=datetime.now(
                timezone.utc
            ),
        )
    )


def get_predictive_maintenance_assessments(
    database_session: Session,
) -> list[
    PredictiveMaintenanceAssessment
]:
    machines = list(
        database_session.scalars(
            select(
                Machine
            ).order_by(
                Machine.asset_code
            )
        ).all()
    )

    assessments = [
        build_machine_assessment(
            machine,
            get_machine_telemetry_history(
                database_session,
                machine.id,
            ),
        )
        for machine in machines
    ]

    return sorted(
        assessments,
        key=lambda assessment: (
            assessment.risk_score
        ),
        reverse=True,
    )


def get_predictive_maintenance_summary(
    database_session: Session,
) -> PredictiveMaintenanceSummary:
    assessments = (
        get_predictive_maintenance_assessments(
            database_session
        )
    )

    total_machines = len(
        assessments
    )

    low_risk = sum(
        assessment.risk_level
        == PredictiveRiskLevel.LOW
        for assessment in assessments
    )

    medium_risk = sum(
        assessment.risk_level
        == PredictiveRiskLevel.MEDIUM
        for assessment in assessments
    )

    high_risk = sum(
        assessment.risk_level
        == PredictiveRiskLevel.HIGH
        for assessment in assessments
    )

    critical_risk = sum(
        assessment.risk_level
        == PredictiveRiskLevel.CRITICAL
        for assessment in assessments
    )

    machines_requiring_attention = (
        medium_risk
        + high_risk
        + critical_risk
    )

    average_risk_score = (
        sum(
            assessment.risk_score
            for assessment in assessments
        )
        / total_machines
        if total_machines
        else 0.0
    )

    return PredictiveMaintenanceSummary(
        total_machines=total_machines,
        low_risk=low_risk,
        medium_risk=medium_risk,
        high_risk=high_risk,
        critical_risk=critical_risk,
        machines_requiring_attention=(
            machines_requiring_attention
        ),
        average_risk_score=round(
            average_risk_score,
            2,
        ),
        generated_at=datetime.now(
            timezone.utc
        ),
    )