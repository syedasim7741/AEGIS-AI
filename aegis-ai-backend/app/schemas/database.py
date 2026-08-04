from pydantic import BaseModel


class DatabaseHealthResponse(BaseModel):
    status: str
    database: str
    user: str
    server_version: str