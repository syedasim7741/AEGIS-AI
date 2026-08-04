from uuid import UUID

from sqlalchemy import (
    delete,
    func,
    or_,
    select,
)
from sqlalchemy.orm import Session

from app.models.vision_inspection import (
    VisionInspection,
    VisionInspectionResult,
    VisionInspectionSeverity,
    VisionInspectionStatus,
)


def create_vision_inspection_record(
    database_session: Session,
    inspection: VisionInspection,
) -> VisionInspection:
    database_session.add(inspection)
    database_session.flush()
    database_session.refresh(inspection)

    return inspection


def get_vision_inspection_by_id(
    database_session: Session,
    inspection_id: UUID,
) -> VisionInspection | None:
    return database_session.get(
        VisionInspection,
        inspection_id,
    )


def get_vision_inspection_records(
    database_session: Session,
    *,
    skip: int = 0,
    limit: int = 100,
    search: str | None = None,
    status: VisionInspectionStatus | None = None,
    result: VisionInspectionResult | None = None,
    severity: VisionInspectionSeverity | None = None,
    machine_id: UUID | None = None,
    uploaded_by_user_id: UUID | None = None,
) -> tuple[list[VisionInspection], int]:
    filters = []

    if search is not None:
        normalized_search = search.strip()

        if normalized_search:
            search_pattern = f"%{normalized_search}%"

            filters.append(
                or_(
                    VisionInspection.product_name.ilike(
                        search_pattern
                    ),
                    VisionInspection.original_filename.ilike(
                        search_pattern
                    ),
                    VisionInspection.inspection_code.ilike(
                        search_pattern
                    ),
                    VisionInspection.zone.ilike(
                        search_pattern
                    ),
                )
            )

    if status is not None:
        filters.append(
            VisionInspection.status == status
        )

    if result is not None:
        filters.append(
            VisionInspection.result == result
        )

    if severity is not None:
        filters.append(
            VisionInspection.severity == severity
        )

    if machine_id is not None:
        filters.append(
            VisionInspection.machine_id == machine_id
        )

    if uploaded_by_user_id is not None:
        filters.append(
            VisionInspection.uploaded_by_user_id
            == uploaded_by_user_id
        )

    records_statement = select(
        VisionInspection
    )

    count_statement = select(
        func.count(VisionInspection.id)
    )

    if filters:
        records_statement = records_statement.where(
            *filters
        )
        count_statement = count_statement.where(
            *filters
        )

    records_statement = (
        records_statement
        .order_by(
            VisionInspection.created_at.desc(),
            VisionInspection.inspection_code.asc(),
        )
        .offset(skip)
        .limit(limit)
    )

    records = list(
        database_session.scalars(
            records_statement
        ).all()
    )

    total = database_session.scalar(
        count_statement
    )

    return records, int(total or 0)


def delete_vision_inspection_record(
    database_session: Session,
    inspection: VisionInspection,
) -> None:
    database_session.delete(inspection)
    database_session.flush()


def delete_vision_inspections_by_machine_id(
    database_session: Session,
    machine_id: UUID,
) -> int:
    statement = (
        delete(VisionInspection)
        .where(
            VisionInspection.machine_id == machine_id
        )
    )

    result = database_session.execute(
        statement
    )

    database_session.flush()

    return int(result.rowcount or 0)
