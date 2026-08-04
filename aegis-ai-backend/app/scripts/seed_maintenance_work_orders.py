from datetime import (
    datetime,
    timedelta,
    timezone,
)

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import engine
from app.models.machine import Machine
from app.models.maintenance_work_order import (
    MaintenancePriority,
    MaintenanceWorkOrder,
    MaintenanceWorkOrderStatus,
)


WORK_ORDER_DEFINITIONS = [
    {
        "work_order_code": "WO-DEMO-001",
        "title": "Inspect abnormal vibration",
        "description": (
            "Inspect bearings, shaft alignment, mounting bolts, "
            "and lubrication because vibration levels are above "
            "the recommended operating range."
        ),
        "priority": MaintenancePriority.CRITICAL,
        "status": MaintenanceWorkOrderStatus.OPEN,
        "risk_score": 88.0,
        "recommended_action": (
            "Stop the machine during the next safe maintenance "
            "window and inspect the rotating assembly."
        ),
        "assigned_to": "Mechanical Maintenance Team",
        "scheduled_offset_hours": -4,
    },
    {
        "work_order_code": "WO-DEMO-002",
        "title": "Check elevated operating temperature",
        "description": (
            "Inspect cooling airflow, filters, lubrication, and "
            "thermal load because operating temperature has risen."
        ),
        "priority": MaintenancePriority.HIGH,
        "status": MaintenanceWorkOrderStatus.SCHEDULED,
        "risk_score": 74.0,
        "recommended_action": (
            "Clean the cooling system and verify temperature "
            "sensor accuracy."
        ),
        "assigned_to": "Electrical Maintenance Team",
        "scheduled_offset_hours": 8,
    },
    {
        "work_order_code": "WO-DEMO-003",
        "title": "Perform preventive lubrication",
        "description": (
            "Complete the scheduled lubrication procedure and "
            "inspect bearings for visible wear."
        ),
        "priority": MaintenancePriority.MEDIUM,
        "status": MaintenanceWorkOrderStatus.IN_PROGRESS,
        "risk_score": 52.0,
        "recommended_action": (
            "Apply approved lubricant and record bearing condition."
        ),
        "assigned_to": "Shift Maintenance Technician",
        "scheduled_offset_hours": -2,
    },
    {
        "work_order_code": "WO-DEMO-004",
        "title": "Verify power consumption trend",
        "description": (
            "Review the recent increase in power consumption and "
            "inspect the machine for mechanical resistance."
        ),
        "priority": MaintenancePriority.MEDIUM,
        "status": MaintenanceWorkOrderStatus.COMPLETED,
        "risk_score": 41.0,
        "recommended_action": (
            "Confirm motor current, mechanical load, and alignment."
        ),
        "assigned_to": "Reliability Engineering Team",
        "scheduled_offset_hours": -24,
    },
    {
        "work_order_code": "WO-DEMO-005",
        "title": "Routine equipment inspection",
        "description": (
            "Perform a standard visual and operational inspection "
            "as part of the preventive maintenance programme."
        ),
        "priority": MaintenancePriority.LOW,
        "status": MaintenanceWorkOrderStatus.SCHEDULED,
        "risk_score": 24.0,
        "recommended_action": (
            "Inspect guards, cables, fasteners, noise, and leakage."
        ),
        "assigned_to": "Operations Maintenance Team",
        "scheduled_offset_hours": 24,
    },
]


def seed_maintenance_work_orders() -> None:
    current_time = datetime.now(
        timezone.utc
    )

    with Session(engine) as database_session:
        machines = list(
            database_session.scalars(
                select(Machine)
                .order_by(
                    Machine.asset_code.asc()
                )
                .limit(
                    len(
                        WORK_ORDER_DEFINITIONS
                    )
                )
            )
        )

        if not machines:
            print(
                "No machines were found. "
                "Seed the machines first."
            )
            return

        created_count = 0
        skipped_count = 0

        for index, definition in enumerate(
            WORK_ORDER_DEFINITIONS
        ):
            machine = machines[
                index % len(machines)
            ]

            existing_work_order = (
                database_session.scalar(
                    select(
                        MaintenanceWorkOrder
                    )
                    .where(
                        MaintenanceWorkOrder
                        .work_order_code
                        == definition[
                            "work_order_code"
                        ]
                    )
                    .limit(1)
                )
            )

            if existing_work_order is not None:
                skipped_count += 1
                continue

            scheduled_for = (
                current_time
                + timedelta(
                    hours=definition[
                        "scheduled_offset_hours"
                    ]
                )
            )

            started_at = None
            completed_at = None

            if (
                definition["status"]
                == MaintenanceWorkOrderStatus
                .IN_PROGRESS
            ):
                started_at = (
                    current_time
                    - timedelta(hours=1)
                )

            if (
                definition["status"]
                == MaintenanceWorkOrderStatus
                .COMPLETED
            ):
                started_at = (
                    current_time
                    - timedelta(hours=6)
                )

                completed_at = (
                    current_time
                    - timedelta(hours=2)
                )

            work_order = (
                MaintenanceWorkOrder(
                    work_order_code=definition[
                        "work_order_code"
                    ],
                    machine_id=machine.id,
                    title=definition["title"],
                    description=definition[
                        "description"
                    ],
                    priority=definition[
                        "priority"
                    ],
                    status=definition["status"],
                    risk_score=definition[
                        "risk_score"
                    ],
                    recommended_action=definition[
                        "recommended_action"
                    ],
                    assigned_to=definition[
                        "assigned_to"
                    ],
                    scheduled_for=scheduled_for,
                    started_at=started_at,
                    completed_at=completed_at,
                )
            )

            database_session.add(
                work_order
            )

            created_count += 1

        database_session.commit()

        total_count = database_session.scalar(
            select(
                MaintenanceWorkOrder
            )
            .with_only_columns(
                MaintenanceWorkOrder.id
            )
        )

        print(
            "Maintenance work-order seed complete."
        )
        print(
            f"Created: {created_count}"
        )
        print(
            f"Skipped existing: {skipped_count}"
        )

        saved_work_orders = list(
            database_session.scalars(
                select(
                    MaintenanceWorkOrder
                ).order_by(
                    MaintenanceWorkOrder
                    .work_order_code.asc()
                )
            )
        )

        print(
            "Total work orders:",
            len(saved_work_orders),
        )

        for work_order in saved_work_orders:
            print(
                work_order.work_order_code,
                "-",
                work_order.priority.value,
                "-",
                work_order.status.value,
            )


if __name__ == "__main__":
    seed_maintenance_work_orders()