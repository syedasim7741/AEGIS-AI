from base64 import b64encode
from json import JSONDecodeError, loads
from time import perf_counter
from typing import Any

import httpx
from pydantic import ValidationError

from app.modules.vision.core.schemas import (
    VisionModelResult,
)
from app.modules.vision.core.settings import (
    get_vision_settings,
)


class VisionProviderError(RuntimeError):
    pass


class VisionProviderConnectionError(
    VisionProviderError
):
    pass


class VisionProviderResponseError(
    VisionProviderError
):
    pass


def _extract_json_object(
    content: str,
) -> dict[str, Any]:
    normalized_content = content.strip()

    if not normalized_content:
        raise VisionProviderResponseError(
            "The vision model returned an empty response."
        )

    try:
        parsed_content = loads(
            normalized_content
        )

    except JSONDecodeError:
        first_brace = normalized_content.find("{")
        last_brace = normalized_content.rfind("}")

        if (
            first_brace < 0
            or last_brace <= first_brace
        ):
            raise VisionProviderResponseError(
                "The vision model did not return "
                "a valid JSON object."
            )

        json_fragment = normalized_content[
            first_brace:last_brace + 1
        ]

        try:
            parsed_content = loads(
                json_fragment
            )

        except JSONDecodeError as error:
            raise VisionProviderResponseError(
                "The vision model returned malformed JSON."
            ) from error

    if not isinstance(parsed_content, dict):
        raise VisionProviderResponseError(
            "The vision model response must be "
            "a JSON object."
        )

    return parsed_content


def _build_inspection_prompt(
    *,
    product_name: str,
    inspection_context: str | None,
) -> str:
    context_text = (
        inspection_context.strip()
        if inspection_context
        and inspection_context.strip()
        else "No additional inspection context was provided."
    )

    return f"""
You are an industrial computer-vision inspection system.

Inspect the supplied image carefully.

Product or asset:
{product_name}

Inspection context:
{context_text}

Return exactly one JSON object using these keys:

{{
  "result": "Pass | Defect | Review",
  "severity": "Low | Medium | High | Critical",
  "confidence": 0 to 100,
  "finding": "Clear factual visual finding",
  "defect_type": "Short defect category or null",
  "recommended_action": "Practical next action or null",
  "inspection_subject_visible": true
}}

Rules:

1. Base the answer only on visible image evidence.
2. Never invent measurements, hidden damage, identities,
   machine state, or events that are not visible.
3. Set inspection_subject_visible to true only when the
   requested product or asset is clearly visible.
4. For screenshots, documents, user interfaces, illustrations,
   unrelated scenes, or images where the requested subject is
   not clearly visible, set inspection_subject_visible to false
   and set the result to "Review".
5. Use "Pass" only when the requested inspection subject is
   clearly visible and no relevant defect is visible.
6. Use "Defect" when a visible defect or safety issue is clear.
7. Use "Review" when the image is unclear, incomplete,
   obstructed, irrelevant, low quality, or needs human review.
8. A Pass result must use Low severity.
9. Set defect_type to null when no defect is visible.
10. Set recommended_action to null only when no action is needed.
11. Do not use Markdown.
12. Do not include text outside the JSON object.
""".strip()


def analyze_image_with_ollama(
    *,
    image_content: bytes,
    product_name: str,
    inspection_context: str | None = None,
) -> tuple[VisionModelResult, int]:
    settings = get_vision_settings()

    if not settings.is_ollama_configured:
        raise VisionProviderConnectionError(
            "Ollama Vision is not configured."
        )

    encoded_image = b64encode(
        image_content
    ).decode("ascii")

    request_payload = {
        "model": settings.ollama_vision_model,
        "stream": False,
        "think": False,
        "format": "json",
        "messages": [
            {
                "role": "user",
                "content": _build_inspection_prompt(
                    product_name=product_name,
                    inspection_context=(
                        inspection_context
                    ),
                ),
                "images": [
                    encoded_image,
                ],
            },
        ],
        "options": {
            "num_ctx": (
                settings.vision_context_window
            ),
            "temperature": (
                settings.vision_temperature
            ),
            "num_predict": (
                settings.vision_max_output_tokens
            ),
        },
    }

    started_at = perf_counter()

    try:
        response = httpx.post(
            (
                settings.ollama_base_url.rstrip("/")
                + "/api/chat"
            ),
            json=request_payload,
            timeout=(
                settings
                .vision_request_timeout_seconds
            ),
        )

        response.raise_for_status()

    except httpx.TimeoutException as error:
        raise VisionProviderConnectionError(
            "The vision model request timed out."
        ) from error

    except httpx.HTTPStatusError as error:
        response_detail = (
            error.response.text.strip()
        )

        raise VisionProviderConnectionError(
            "The Ollama Vision request failed "
            f"with HTTP {error.response.status_code}: "
            f"{response_detail[:500]}"
        ) from error

    except httpx.HTTPError as error:
        raise VisionProviderConnectionError(
            "Could not connect to the local "
            "Ollama Vision service."
        ) from error

    duration_ms = round(
        (perf_counter() - started_at) * 1000
    )

    try:
        response_payload = response.json()

    except ValueError as error:
        raise VisionProviderResponseError(
            "Ollama returned an invalid HTTP response."
        ) from error

    response_content = (
        response_payload
        .get("message", {})
        .get("content", "")
    )

    parsed_content = _extract_json_object(
        str(response_content)
    )

    try:
        model_result = (
            VisionModelResult.model_validate(
                parsed_content
            )
        )

    except ValidationError as error:
        raise VisionProviderResponseError(
            "The vision model response failed "
            f"schema validation: {error}"
        ) from error

    return model_result, duration_ms
