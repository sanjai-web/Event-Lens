from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.limiter import limiter
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, decode_token
from app.models.photographer import Photographer
from app.schemas.auth import SignupRequest, LoginRequest, TokenResponse, RefreshRequest, PhotographerProfile
from app.api.v1.deps import get_current_photographer

router = APIRouter()

@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(req: SignupRequest, db: AsyncSession = Depends(get_db)):
    # Check if user with email already exists
    existing = await db.execute(select(Photographer).where(Photographer.email == req.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A photographer account with this email already exists."
        )

    photographer = Photographer(
        name=req.name,
        email=req.email.lower(),
        phone=req.phone,
        password_hash=get_password_hash(req.password),
        business_name=req.business_name,
    )
    db.add(photographer)
    await db.commit()
    await db.refresh(photographer)

    access_token = create_access_token(photographer.id)
    refresh_token = create_refresh_token(photographer.id)

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)

@router.post("/login", response_model=TokenResponse)
@limiter.limit("30/minute")
async def login(request: Request, req: LoginRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(Photographer).where(Photographer.email == req.email.lower())
    res = await db.execute(stmt)
    photographer = res.scalar_one_or_none()

    if not photographer or not verify_password(req.password, photographer.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not photographer.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled.")

    access_token = create_access_token(photographer.id)
    refresh_token = create_refresh_token(photographer.id)

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token_endpoint(req: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token.")

    user_id = payload.get("sub")
    stmt = select(Photographer).where(Photographer.id == user_id, Photographer.is_active == True)
    res = await db.execute(stmt)
    photographer = res.scalar_one_or_none()

    if not photographer:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")

    new_access_token = create_access_token(photographer.id)
    new_refresh_token = create_refresh_token(photographer.id)

    return TokenResponse(access_token=new_access_token, refresh_token=new_refresh_token)

@router.get("/me", response_model=PhotographerProfile)
async def get_my_profile(current_user: Photographer = Depends(get_current_photographer)):
    return current_user
