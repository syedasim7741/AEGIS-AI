import asyncio
from datetime import (
    datetime,
    timezone,
)
from uuid import UUID

from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
)
from jwt.exceptions import (
    InvalidTokenError,
)

from app.core.security import (
    decode_access_token,
)
from app.db.session import (
    SessionLocal,
)
from app.models.user import (
    UserStatus,
)
from app.repositories.user import (
    get_user_by_id,
)
from app.services.machine_service import (
    get_machine_summary,
)
from app.services.robot_service import (
    get_robot_summary,
)


router = APIRouter(
    tags=["Live Telemetry"],
)


TELEMETRY_INTERVAL_SECONDS = 5

WEBSOCKET_AUTH_PROTOCOL = (
    "aegis-auth"
)


def get_websocket_access_token(
    websocket: WebSocket,
) -> str | None:
    protocol_header = (
        websocket.headers.get(
            "sec-websocket-protocol",
            "",
        )
    )

    requested_protocols = [
        protocol.strip()
        for protocol in protocol_header.split(
            ","
        )
        if protocol.strip()
    ]

    if (
        len(requested_protocols) < 2
        or requested_protocols[0]
        != WEBSOCKET_AUTH_PROTOCOL
    ):
        return None

    return requested_protocols[1]


@router.websocket(
    "/telemetry/live"
)
async def stream_live_telemetry(
    websocket: WebSocket,
) -> None:
    access_token = (
        get_websocket_access_token(
            websocket
        )
    )

    if not access_token:
        await websocket.close(
            code=4401
        )

        return

    database_session = (
        SessionLocal()
    )

    try:
        try:
            user_id = UUID(
                decode_access_token(
                    access_token
                )
            )

        except (
            InvalidTokenError,
            ValueError,
        ):
            await websocket.close(
                code=4401
            )

            return

        user = get_user_by_id(
            database_session,
            user_id,
        )

        if user is None:
            await websocket.close(
                code=4401
            )

            return

        if (
            user.status
            != UserStatus.ACTIVE
        ):
            await websocket.close(
                code=4403
            )

            return

        await websocket.accept(
            subprotocol=(
                WEBSOCKET_AUTH_PROTOCOL
            )
        )

        await websocket.send_json(
            {
                "event": (
                    "telemetry.connected"
                ),
                "timestamp": (
                    datetime.now(
                        timezone.utc
                    ).isoformat()
                ),
                "message": (
                    "Live industrial "
                    "telemetry connected."
                ),
            }
        )

        while True:
            database_session.expire_all()

            machine_summary = (
                get_machine_summary(
                    database_session
                )
            )

            robot_summary = (
                get_robot_summary(
                    database_session
                )
            )

            await websocket.send_json(
                {
                    "event": (
                        "telemetry.snapshot"
                    ),
                    "timestamp": (
                        datetime.now(
                            timezone.utc
                        ).isoformat()
                    ),
                    "machines": (
                        machine_summary
                        .model_dump()
                    ),
                    "robots": (
                        robot_summary
                        .model_dump()
                    ),
                }
            )

            await asyncio.sleep(
                TELEMETRY_INTERVAL_SECONDS
            )

    except WebSocketDisconnect:
        pass

    finally:
        database_session.close()