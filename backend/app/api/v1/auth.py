from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.auth import UserRegister, UserLogin, Token
from app.models.user import User
from app.models.business import BusinessMembership
from app.services.auth_service import AuthService
from app.api.deps import get_current_user, get_current_membership


router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=Token,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    data: UserRegister,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await AuthService.register_user_and_business(db, data)
    except HTTPException:
        raise
    except Exception as exc:
        # Ստուգիր Render-ի logs-ը՝ իրական պատճառը տեսնելու համար։
        print(f"Registration error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed",
        )


@router.post("/login", response_model=Token)
async def login(
    credentials: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await AuthService.authenticate_user(db, credentials)
    except HTTPException:
        raise
    except Exception as exc:
        print(f"Login error: {exc}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed",
        )


@router.get("/me")
async def get_me(
    user: User = Depends(get_current_user),
    membership: BusinessMembership = Depends(get_current_membership),
):
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "business_id": membership.business_id,
        "role": membership.role.value,
        "is_active": user.is_active,
    }
