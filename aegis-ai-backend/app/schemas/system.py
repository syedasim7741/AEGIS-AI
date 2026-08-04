from datetime import datetime

from pydantic import BaseModel


class RootResponse(BaseModel):
    application: str
    status: str
    version: str
    environment: str
    documentation: str


class APIInformationResponse(BaseModel):
    name: str
    description: str
    version: str
    environment: str
    api_prefix: str


class HealthCheckResponse(BaseModel):
    status: str
    service: str
    environment: str
    timestamp: datetime