from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import decode_token
from app.models.photographer import Photographer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_photographer(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> Photographer:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise credentials_exception
        
    user_id: str = payload.get("sub")
    if not user_id:
        raise credentials_exception
        
    stmt = select(Photographer).where(Photographer.id == user_id, Photographer.is_active == True)
    result = await db.execute(stmt)
    photographer = result.scalar_one_or_none()
    
    if not photographer:
        raise credentials_exception
        
    return photographer
