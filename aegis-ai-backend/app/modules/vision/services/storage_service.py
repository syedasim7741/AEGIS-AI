from dataclasses import dataclass
from hashlib import sha256
from io import BytesIO
from pathlib import Path
from shutil import copyfileobj
from uuid import uuid4
import warnings

from PIL import (
    Image,
    ImageOps,
    UnidentifiedImageError,
)

from app.modules.vision.core.settings import (
    get_vision_settings,
)


class InvalidImageError(ValueError):
    pass


class UnsupportedImageTypeError(
    InvalidImageError
):
    pass


class ImageTooLargeError(
    InvalidImageError
):
    pass


class InvalidImageDimensionsError(
    InvalidImageError
):
    pass


class EmptyImageError(
    InvalidImageError
):
    pass


@dataclass(frozen=True)
class ValidatedImage:
    original_filename: str
    content_type: str
    image_format: str
    width: int
    height: int
    sanitized_content: bytes


@dataclass(frozen=True)
class StoredImage:
    original_filename: str
    stored_filename: str
    content_type: str
    file_size_bytes: int
    storage_path: str
    checksum_sha256: str
    image_width: int
    image_height: int


ALLOWED_IMAGE_TYPES = {
    "image/jpeg": {
        "extensions": {".jpg", ".jpeg"},
        "format": "JPEG",
        "stored_extension": ".jpg",
    },
    "image/png": {
        "extensions": {".png"},
        "format": "PNG",
        "stored_extension": ".png",
    },
    "image/webp": {
        "extensions": {".webp"},
        "format": "WEBP",
        "stored_extension": ".webp",
    },
}


def normalize_filename(
    filename: str | None,
) -> str:
    if filename is None:
        raise InvalidImageError(
            "An image filename is required."
        )

    normalized_filename = Path(
        filename
    ).name.strip()

    if not normalized_filename:
        raise InvalidImageError(
            "A valid image filename is required."
        )

    return normalized_filename


def _sanitize_image(
    *,
    image: Image.Image,
    image_format: str,
) -> bytes:
    normalized_image = ImageOps.exif_transpose(
        image
    )

    output = BytesIO()

    if image_format == "JPEG":
        if normalized_image.mode != "RGB":
            normalized_image = (
                normalized_image.convert("RGB")
            )

        normalized_image.save(
            output,
            format="JPEG",
            quality=95,
            optimize=True,
        )

    elif image_format == "PNG":
        if normalized_image.mode not in {
            "RGB",
            "RGBA",
            "L",
        }:
            normalized_image = (
                normalized_image.convert("RGBA")
            )

        normalized_image.save(
            output,
            format="PNG",
            optimize=True,
        )

    elif image_format == "WEBP":
        if normalized_image.mode not in {
            "RGB",
            "RGBA",
        }:
            normalized_image = (
                normalized_image.convert("RGB")
            )

        normalized_image.save(
            output,
            format="WEBP",
            quality=95,
            method=6,
        )

    else:
        raise UnsupportedImageTypeError(
            "The detected image format is unsupported."
        )

    return output.getvalue()


def validate_image_content(
    *,
    filename: str | None,
    content_type: str | None,
    content: bytes,
) -> ValidatedImage:
    settings = get_vision_settings()

    normalized_filename = normalize_filename(
        filename
    )

    normalized_content_type = (
        content_type
        or "application/octet-stream"
    ).lower().strip()

    type_configuration = (
        ALLOWED_IMAGE_TYPES.get(
            normalized_content_type
        )
    )

    if type_configuration is None:
        raise UnsupportedImageTypeError(
            "Only JPEG, PNG, and WebP images "
            "are supported."
        )

    extension = Path(
        normalized_filename
    ).suffix.lower()

    if (
        extension
        not in type_configuration["extensions"]
    ):
        raise UnsupportedImageTypeError(
            "The file extension does not match "
            "the uploaded image type."
        )

    if not content:
        raise EmptyImageError(
            "The uploaded image is empty."
        )

    maximum_size_bytes = (
        settings.vision_max_file_size_mb
        * 1024
        * 1024
    )

    if len(content) > maximum_size_bytes:
        raise ImageTooLargeError(
            "The uploaded image exceeds "
            f"{settings.vision_max_file_size_mb} MB."
        )

    try:
        with warnings.catch_warnings():
            warnings.simplefilter(
                "error",
                Image.DecompressionBombWarning,
            )

            verification_image = Image.open(
                BytesIO(content)
            )

            detected_format = (
                verification_image.format
                or ""
            ).upper()

            verification_image.verify()

            image = Image.open(
                BytesIO(content)
            )

            width, height = image.size

            if (
                width <= 0
                or height <= 0
                or width
                > settings.vision_max_image_width
                or height
                > settings.vision_max_image_height
                or width * height
                > settings.vision_max_image_pixels
            ):
                raise InvalidImageDimensionsError(
                    "The uploaded image dimensions "
                    "exceed the configured limits."
                )

            expected_format = str(
                type_configuration["format"]
            )

            if detected_format != expected_format:
                raise UnsupportedImageTypeError(
                    "The detected image format does "
                    "not match its content type."
                )

            image.load()

            sanitized_content = _sanitize_image(
                image=image,
                image_format=detected_format,
            )

    except InvalidImageError:
        raise

    except (
        Image.DecompressionBombError,
        Image.DecompressionBombWarning,
    ) as error:
        raise InvalidImageDimensionsError(
            "The uploaded image is too large "
            "to process safely."
        ) from error

    except (
        UnidentifiedImageError,
        OSError,
        SyntaxError,
        ValueError,
    ) as error:
        raise InvalidImageError(
            "The uploaded file is not a valid image."
        ) from error

    return ValidatedImage(
        original_filename=normalized_filename,
        content_type=normalized_content_type,
        image_format=detected_format,
        width=width,
        height=height,
        sanitized_content=sanitized_content,
    )


def save_image(
    *,
    filename: str | None,
    content_type: str | None,
    content: bytes,
) -> StoredImage:
    settings = get_vision_settings()

    validated_image = validate_image_content(
        filename=filename,
        content_type=content_type,
        content=content,
    )

    type_configuration = ALLOWED_IMAGE_TYPES[
        validated_image.content_type
    ]

    stored_filename = (
        f"{uuid4().hex}"
        f"{type_configuration['stored_extension']}"
    )

    storage_directory = Path(
        settings.vision_storage_directory
    )

    storage_directory.mkdir(
        parents=True,
        exist_ok=True,
    )

    storage_path = (
        storage_directory
        / stored_filename
    )

    temporary_path = storage_path.with_suffix(
        storage_path.suffix + ".tmp"
    )

    try:
        with (
            BytesIO(
                validated_image.sanitized_content
            ) as source,
            temporary_path.open("wb") as destination,
        ):
            copyfileobj(
                source,
                destination,
            )

        temporary_path.replace(storage_path)

    finally:
        if temporary_path.exists():
            temporary_path.unlink()

    sanitized_content = (
        validated_image.sanitized_content
    )

    return StoredImage(
        original_filename=(
            validated_image.original_filename
        ),
        stored_filename=stored_filename,
        content_type=(
            validated_image.content_type
        ),
        file_size_bytes=len(
            sanitized_content
        ),
        storage_path=str(
            storage_path.resolve()
        ),
        checksum_sha256=sha256(
            sanitized_content
        ).hexdigest(),
        image_width=validated_image.width,
        image_height=validated_image.height,
    )


def delete_stored_image(
    storage_path: str,
) -> None:
    image_path = Path(storage_path)

    if image_path.exists():
        image_path.unlink()
