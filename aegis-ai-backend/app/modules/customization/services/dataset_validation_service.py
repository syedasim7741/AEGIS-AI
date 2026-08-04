from hashlib import sha256
from json import (
    JSONDecodeError,
    dumps,
    loads,
)
from pathlib import Path

from pydantic import ValidationError

from app.modules.customization.core.schemas import (
    CustomizationExample,
    DatasetValidationIssue,
    DatasetValidationReport,
)
from app.modules.customization.core.settings import (
    get_customization_settings,
)


class CustomizationDatasetError(
    RuntimeError
):
    pass


class DatasetNotFoundError(
    CustomizationDatasetError
):
    pass


class DatasetTooLargeError(
    CustomizationDatasetError
):
    pass


class UnsupportedDatasetTypeError(
    CustomizationDatasetError
):
    pass


def _conversation_checksum(
    example: CustomizationExample,
) -> str:
    conversation_payload = {
        "category": example.category.value,
        "messages": [
            message.model_dump(
                mode="json",
            )
            for message in example.messages
        ],
    }

    canonical_content = dumps(
        conversation_payload,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )

    return sha256(
        canonical_content.encode("utf-8")
    ).hexdigest()


def validate_jsonl_dataset(
    source_path: str | Path,
) -> tuple[
    DatasetValidationReport,
    Path | None,
    Path,
]:
    settings = get_customization_settings()

    dataset_path = Path(source_path)

    if not dataset_path.is_file():
        raise DatasetNotFoundError(
            "The requested dataset file "
            "was not found."
        )

    if dataset_path.suffix.lower() != ".jsonl":
        raise UnsupportedDatasetTypeError(
            "Only JSONL datasets are supported."
        )

    maximum_size_bytes = (
        settings.customization_max_dataset_size_mb
        * 1024
        * 1024
    )

    if (
        dataset_path.stat().st_size
        > maximum_size_bytes
    ):
        raise DatasetTooLargeError(
            "The dataset exceeds "
            f"{settings.customization_max_dataset_size_mb} MB."
        )

    valid_examples: list[
        CustomizationExample
    ] = []

    issues: list[
        DatasetValidationIssue
    ] = []

    categories: dict[str, int] = {}

    seen_example_ids: set[str] = set()
    seen_conversations: set[str] = set()

    total_lines = 0
    invalid_examples = 0
    duplicate_examples = 0

    with dataset_path.open(
        "r",
        encoding="utf-8-sig",
    ) as dataset_file:
        for line_number, raw_line in enumerate(
            dataset_file,
            start=1,
        ):
            total_lines += 1

            normalized_line = raw_line.strip()

            if not normalized_line:
                invalid_examples += 1

                issues.append(
                    DatasetValidationIssue(
                        line_number=line_number,
                        error=(
                            "Blank JSONL lines "
                            "are not allowed."
                        ),
                    )
                )

                continue

            try:
                raw_example = loads(
                    normalized_line
                )

            except JSONDecodeError as error:
                invalid_examples += 1

                issues.append(
                    DatasetValidationIssue(
                        line_number=line_number,
                        error=(
                            "Invalid JSON: "
                            f"{error.msg}"
                        ),
                    )
                )

                continue

            if not isinstance(
                raw_example,
                dict,
            ):
                invalid_examples += 1

                issues.append(
                    DatasetValidationIssue(
                        line_number=line_number,
                        error=(
                            "Each JSONL line must "
                            "contain one JSON object."
                        ),
                    )
                )

                continue

            try:
                example = (
                    CustomizationExample
                    .model_validate(raw_example)
                )

            except ValidationError as error:
                invalid_examples += 1

                issues.append(
                    DatasetValidationIssue(
                        line_number=line_number,
                        error=str(error)[:2000],
                    )
                )

                continue

            if (
                example.example_id
                in seen_example_ids
            ):
                duplicate_examples += 1

                issues.append(
                    DatasetValidationIssue(
                        line_number=line_number,
                        error=(
                            "Duplicate example_id: "
                            f"{example.example_id}"
                        ),
                    )
                )

                continue

            conversation_checksum = (
                _conversation_checksum(
                    example
                )
            )

            if (
                conversation_checksum
                in seen_conversations
            ):
                duplicate_examples += 1

                issues.append(
                    DatasetValidationIssue(
                        line_number=line_number,
                        error=(
                            "Duplicate conversation "
                            "content detected."
                        ),
                    )
                )

                continue

            seen_example_ids.add(
                example.example_id
            )

            seen_conversations.add(
                conversation_checksum
            )

            valid_examples.append(example)

            category_name = (
                example.category.value
            )

            categories[category_name] = (
                categories.get(
                    category_name,
                    0,
                )
                + 1
            )

    valid_example_count = len(
        valid_examples
    )

    if (
        valid_example_count
        < settings.customization_min_examples
    ):
        issues.append(
            DatasetValidationIssue(
                line_number=max(
                    total_lines,
                    1,
                ),
                error=(
                    "The dataset must contain at least "
                    f"{settings.customization_min_examples} "
                    "valid examples."
                ),
            )
        )

    if (
        valid_example_count
        > settings.customization_max_examples
    ):
        issues.append(
            DatasetValidationIssue(
                line_number=max(
                    total_lines,
                    1,
                ),
                error=(
                    "The dataset exceeds the maximum "
                    f"of {settings.customization_max_examples} "
                    "valid examples."
                ),
            )
        )

    is_valid = (
        invalid_examples == 0
        and duplicate_examples == 0
        and not issues
        and settings.customization_min_examples
        <= valid_example_count
        <= settings.customization_max_examples
    )

    report = DatasetValidationReport(
        dataset_filename=dataset_path.name,
        total_lines=total_lines,
        valid_examples=valid_example_count,
        invalid_examples=invalid_examples,
        duplicate_examples=duplicate_examples,
        categories=categories,
        issues=issues,
        is_valid=is_valid,
    )

    report_directory = Path(
        settings.customization_report_directory
    )

    report_directory.mkdir(
        parents=True,
        exist_ok=True,
    )

    report_path = (
        report_directory
        / f"{dataset_path.stem}_validation.json"
    )

    report_path.write_text(
        report.model_dump_json(
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    validated_path: Path | None = None

    if is_valid:
        validated_directory = Path(
            settings
            .customization_validated_dataset_directory
        )

        validated_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        validated_path = (
            validated_directory
            / f"{dataset_path.stem}_validated.jsonl"
        )

        validated_lines = [
            dumps(
                example.model_dump(
                    mode="json",
                ),
                ensure_ascii=False,
                sort_keys=True,
                separators=(",", ":"),
            )
            for example in valid_examples
        ]

        validated_path.write_text(
            "\n".join(validated_lines)
            + "\n",
            encoding="utf-8",
        )

    return (
        report,
        validated_path,
        report_path,
    )
