from datetime import UTC, datetime
from pathlib import Path
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.models.vision_inspection import (
    VisionInspection,
    VisionInspectionStatus,
)
from app.modules.vision.providers.ollama_provider import (
    VisionProviderError,
    analyze_image_with_ollama,
)
from app.modules.vision.repositories.inspection_repository import (
    create_vision_inspection_record,
    delete_vision_inspection_record,
    get_vision_inspection_by_id,
    get_vision_inspection_records,
)
from app.modules.vision.services.storage_service import (
    StoredImage,
    delete_stored_image,
    save_image,
)


class VisionInspectionError(RuntimeError):
    pass


class VisionInspectionNotFoundError(
    VisionInspectionError
):
    pass


class VisionInspectionProcessingError(
    VisionInspectionError
):
    pass


def _generate_inspection_code() -> str:
    timestamp = datetime.now(
        UTC
    ).strftime("%Y%m%d-%H%M%S")

    suffix = uuid4().hex[:6].upper()

    return f"VIS-{timestamp}-{suffix}"


def _create_pending_inspection(
    database_session: Session,
    *,
    uploaded_by_user_id: UUID | None,
    machine_id: UUID | None,
    product_name: str,
    camera: str | None,
    zone: str | None,
    stored_image: StoredImage,
    model_name: str,
) -> VisionInspection:
    inspection = VisionInspection(
        inspection_code=(
            _generate_inspection_code()
        ),
        uploaded_by_user_id=(
            uploaded_by_user_id
        ),
        machine_id=machine_id,
        product_name=product_name,
        camera=camera,
        zone=zone,
        original_filename=(
            stored_image.original_filename
        ),
        stored_filename=(
            stored_image.stored_filename
        ),
        content_type=(
            stored_image.content_type
        ),
        file_size_bytes=(
            stored_image.file_size_bytes
        ),
        storage_path=(
            stored_image.storage_path
        ),
        checksum_sha256=(
            stored_image.checksum_sha256
        ),
        image_width=(
            stored_image.image_width
        ),
        image_height=(
            stored_image.image_height
        ),
        model_provider="ollama",
        model_name=model_name,
        status=(
            VisionInspectionStatus.PENDING
        ),
    )

    create_vision_inspection_record(
        database_session,
        inspection,
    )

    database_session.commit()
    database_session.refresh(inspection)

    return inspection


def run_vision_inspection(
    database_session: Session,
    *,
    uploaded_by_user_id: UUID | None,
    filename: str | None,
    content_type: str | None,
    content: bytes,
    product_name: str,
    machine_id: UUID | None = None,
    camera: str | None = None,
    zone: str | None = None,
    inspection_context: str | None = None,
) -> VisionInspection:
    from app.modules.vision.core.settings import (
        get_vision_settings,
    )

    normalized_product_name = (
        product_name.strip()
    )

    if not normalized_product_name:
        raise VisionInspectionProcessingError(
            "A product or asset name is required."
        )

    normalized_camera = (
        camera.strip()
        if camera and camera.strip()
        else None
    )

    normalized_zone = (
        zone.strip()
        if zone and zone.strip()
        else None
    )

    settings = get_vision_settings()

    stored_image: StoredImage | None = None
    inspection: VisionInspection | None = None

    try:
        stored_image = save_image(
            filename=filename,
            content_type=content_type,
            content=content,
        )

        inspection = _create_pending_inspection(
            database_session,
            uploaded_by_user_id=(
                uploaded_by_user_id
            ),
            machine_id=machine_id,
            product_name=(
                normalized_product_name
            ),
            camera=normalized_camera,
            zone=normalized_zone,
            stored_image=stored_image,
            model_name=(
                settings.ollama_vision_model
            ),
        )

        inspection.status = (
            VisionInspectionStatus.PROCESSING
        )

        database_session.commit()
        database_session.refresh(inspection)

        sanitized_image_content = Path(
            stored_image.storage_path
        ).read_bytes()

        model_result, duration_ms = (
            analyze_image_with_ollama(
                image_content=(
                    sanitized_image_content
                ),
                product_name=(
                    normalized_product_name
                ),
                inspection_context=(
                    inspection_context
                ),
            )
        )

        inspection.result = (
            model_result.result
        )
        inspection.severity = (
            model_result.severity
        )
        inspection.confidence = (
            model_result.confidence
        )
        inspection.finding = (
            model_result.finding
        )
        inspection.defect_type = (
            model_result.defect_type
        )
        inspection.recommended_action = (
            model_result.recommended_action
        )
        inspection.analysis_duration_ms = (
            duration_ms
        )
        inspection.status = (
            VisionInspectionStatus.COMPLETED
        )
        inspection.completed_at = datetime.now(
            UTC
        )
        inspection.error_message = None

        database_session.commit()
        database_session.refresh(inspection)

        return inspection

    except VisionProviderError as error:
        database_session.rollback()

        if inspection is not None:
            inspection.status = (
                VisionInspectionStatus.FAILED
            )
            inspection.error_message = str(
                error
            )[:2000]
            inspection.completed_at = (
                datetime.now(UTC)
            )

            database_session.add(inspection)
            database_session.commit()
            database_session.refresh(inspection)

        raise VisionInspectionProcessingError(
            str(error)
        ) from error

    except Exception:
        database_session.rollback()

        if inspection is None and stored_image is not None:
            delete_stored_image(
                stored_image.storage_path
            )

        raise


def get_vision_inspection_or_raise(
    database_session: Session,
    inspection_id: UUID,
) -> VisionInspection:
    inspection = get_vision_inspection_by_id(
        database_session,
        inspection_id,
    )

    if inspection is None:
        raise VisionInspectionNotFoundError(
            "The requested vision inspection "
            "was not found."
        )

    return inspection


def list_vision_inspections(
    database_session: Session,
    **filters: object,
) -> tuple[list[VisionInspection], int]:
    return get_vision_inspection_records(
        database_session,
        **filters,
    )


def delete_vision_inspection(
    database_session: Session,
    inspection_id: UUID,
) -> None:
    inspection = get_vision_inspection_or_raise(
        database_session,
        inspection_id,
    )

    storage_path = inspection.storage_path

    delete_vision_inspection_record(
        database_session,
        inspection,
    )

    database_session.commit()

    delete_stored_image(storage_path)
