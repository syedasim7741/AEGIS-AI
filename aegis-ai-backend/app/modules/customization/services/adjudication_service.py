from pathlib import Path

from app.modules.customization.core.adjudication_schemas import (
    AdjudicationClassification,
    EvaluationAdjudicationFile,
    ReviewedEvaluationCase,
    ReviewedEvaluationReport,
)
from app.modules.customization.core.evaluation_result_schemas import (
    EvaluationModelReport,
)


class EvaluationAdjudicationError(
    RuntimeError
):
    pass


def create_reviewed_evaluation_report(
    *,
    report_path: str | Path,
    adjudication_path: str | Path,
    output_path: str | Path,
) -> ReviewedEvaluationReport:
    source_path = Path(report_path)
    review_path = Path(adjudication_path)
    destination_path = Path(output_path)

    if not source_path.is_file():
        raise EvaluationAdjudicationError(
            "The automated evaluation report "
            "was not found."
        )

    if not review_path.is_file():
        raise EvaluationAdjudicationError(
            "The adjudication file was not found."
        )

    automated_report = (
        EvaluationModelReport
        .model_validate_json(
            source_path.read_text(
                encoding="utf-8-sig",
            )
        )
    )

    adjudication = (
        EvaluationAdjudicationFile
        .model_validate_json(
            review_path.read_text(
                encoding="utf-8-sig",
            )
        )
    )

    result_by_case_id = {
        result.case_id: result
        for result in automated_report.results
    }

    unknown_case_ids = [
        decision.case_id
        for decision in adjudication.decisions
        if decision.case_id
        not in result_by_case_id
    ]

    if unknown_case_ids:
        raise EvaluationAdjudicationError(
            "The adjudication contains unknown "
            f"case IDs: {unknown_case_ids}"
        )

    decision_by_case_id = {
        decision.case_id: decision
        for decision in adjudication.decisions
    }

    reviewed_cases: list[
        ReviewedEvaluationCase
    ] = []

    for result in automated_report.results:
        decision = decision_by_case_id.get(
            result.case_id
        )

        if decision is None:
            final_passed = result.passed
            classification = (
                AdjudicationClassification
                .NOT_REVIEWED
            )
            reason = None
        else:
            final_passed = (
                decision.final_passed
            )
            classification = (
                decision.classification
            )
            reason = decision.reason

        reviewed_score = (
            1.0
            if final_passed
            else result.score
        )

        reviewed_cases.append(
            ReviewedEvaluationCase(
                case_id=result.case_id,
                category=(
                    result.category.value
                ),
                safety_critical=(
                    result.safety_critical
                ),
                automated_passed=(
                    result.passed
                ),
                final_passed=(
                    final_passed
                ),
                automated_score=(
                    result.score
                ),
                reviewed_score=(
                    reviewed_score
                ),
                classification=(
                    classification
                ),
                reason=reason,
            )
        )

    total_cases = len(reviewed_cases)

    automated_passed = sum(
        case.automated_passed
        for case in reviewed_cases
    )

    reviewed_passed = sum(
        case.final_passed
        for case in reviewed_cases
    )

    automated_score = (
        sum(
            case.automated_score
            for case in reviewed_cases
        )
        / total_cases
        if total_cases
        else 0.0
    )

    reviewed_score = (
        sum(
            case.reviewed_score
            for case in reviewed_cases
        )
        / total_cases
        if total_cases
        else 0.0
    )

    safety_cases = [
        case
        for case in reviewed_cases
        if case.safety_critical
    ]

    report = ReviewedEvaluationReport(
        model_name=(
            automated_report.model_name
        ),
        source_report=str(source_path),
        total_cases=total_cases,
        automated_passed_cases=(
            automated_passed
        ),
        reviewed_passed_cases=(
            reviewed_passed
        ),
        automated_pass_rate=round(
            automated_passed / total_cases,
            4,
        ) if total_cases else 0.0,
        reviewed_pass_rate=round(
            reviewed_passed / total_cases,
            4,
        ) if total_cases else 0.0,
        automated_score=round(
            automated_score,
            4,
        ),
        reviewed_score=round(
            reviewed_score,
            4,
        ),
        safety_critical_total=len(
            safety_cases
        ),
        automated_safety_passed=sum(
            case.automated_passed
            for case in safety_cases
        ),
        reviewed_safety_passed=sum(
            case.final_passed
            for case in safety_cases
        ),
        cases=reviewed_cases,
    )

    destination_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    destination_path.write_text(
        report.model_dump_json(
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    return report
