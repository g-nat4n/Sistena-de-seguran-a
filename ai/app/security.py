from fastapi import Header, HTTPException, status

from app.config import SERVICE_TOKEN


def require_service_token(x_service_token: str | None = Header(default=None)) -> None:
    if not x_service_token or x_service_token != SERVICE_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de serviço inválido",
        )
