from typing import List, Optional

from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from jose import jwt, JWTError

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db

from app.models.user import User
from app.models.business import BusinessMembership, RoleEnum


# Swagger Authorization: Bearer Token
bearer_scheme = HTTPBearer(auto_error=False)


def authentication_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Նույնականացումը չհաջողվեց։ Խնդրում ենք կրկին մուտք գործել։",
        headers={"WWW-Authenticate": "Bearer"},
    )


def decode_access_token(
    credentials: Optional[HTTPAuthorizationCredentials],
) -> dict:
    """
    Extract and validate JWT access token.
    """

    if credentials is None:
        raise authentication_error()

    if credentials.scheme.lower() != "bearer":
        raise authentication_error()

    token = credentials.credentials

    if not token:
        raise authentication_error()

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        user_id = payload.get("sub")

        if not isinstance(user_id, str) or not user_id:
            raise authentication_error()

        return payload

    except JWTError:
        raise authentication_error()


async def get_token_payload(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(
        bearer_scheme
    ),
) -> dict:
    """
    Validate Bearer token once and return its payload.
    """

    return decode_access_token(credentials)


async def get_current_user(
    db: AsyncSession = Depends(get_db),
    payload: dict = Depends(get_token_payload),
) -> User:
    """
    Return the authenticated active user.
    """

    user_id = payload["sub"]

    stmt = select(User).where(
        User.id == user_id,
        User.is_active.is_(True),
    )

    result = await db.execute(stmt)

    user = result.scalar_one_or_none()

    if user is None:
        raise authentication_error()

    return user


async def get_current_membership(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    payload: dict = Depends(get_token_payload),
    x_business_id: Optional[str] = Header(
        default=None,
        alias="X-Business-ID",
    ),
) -> BusinessMembership:
    """
    Verify that the authenticated user belongs to an active business.

    All business operations must use the returned membership.business_id
    to enforce tenant isolation.
    """

    token_business_id = payload.get("business_id")

    # A workspace selected through the header must still be authorized.
    business_id = x_business_id or token_business_id

    if business_id is not None and not isinstance(business_id, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Մուտքի տվյալները անվավեր են։",
        )

    query = select(BusinessMembership).where(
        BusinessMembership.user_id == current_user.id,
        BusinessMembership.is_active.is_(True),
    )

    if business_id:
        query = query.where(
            BusinessMembership.business_id == business_id
        )

    result = await db.execute(query)

    memberships = result.scalars().all()

    if not memberships:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Դուք չունեք մուտքի իրավունք այս բիզնեսի աշխատանքային տարածքին։",
        )

    # Never silently select an arbitrary workspace.
    if not business_id and len(memberships) > 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Նշեք բիզնեսի ID-ն X-Business-ID վերնագրում։",
        )

    return memberships[0]


class RoleChecker:
    """
    Server-side role-based access control.

    Example:
        Depends(RoleChecker([RoleEnum.OWNER, RoleEnum.MANAGER]))
    """

    def __init__(self, allowed_roles: List[RoleEnum]):
        self.allowed_roles = allowed_roles

    def __call__(
        self,
        membership: BusinessMembership = Depends(
            get_current_membership
        ),
    ) -> BusinessMembership:

        if membership.role not in self.allowed_roles:

            roles_am = ", ".join(
                role.value for role in self.allowed_roles
            )

            current_role = membership.role.value

            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    "Գործողությունը թույլատրված է միայն "
                    f"հետևյալ դերերին՝ {roles_am}։ "
                    f"Ձեր դերն է՝ {current_role}։"
                ),
            )

        return membership