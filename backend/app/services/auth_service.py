import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException, status
from app.models.user import User
from app.models.business import Business, BusinessMembership, RoleEnum
from app.models.inventory import Warehouse
from app.models.employee import Employee
from app.schemas.auth import UserRegister, UserLogin, Token
from app.core.security import get_password_hash, verify_password, create_access_token


class AuthService:
    @staticmethod
    async def register_user_and_business(db: AsyncSession, data: UserRegister) -> Token:
        """
        Creates user account, new business workspace, owner membership,
        default warehouse, and employee profile inside an atomic transaction.
        """
        # 1. Check if email already exists
        stmt = select(User).where(User.email == data.email.lower().strip())
        res = await db.execute(stmt)
        if res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Նշված էլ․ հասցեով օգտատեր արդեն գրանցված է համակարգում:"
            )

        # 2. Create User
        user = User(
            id=str(uuid.uuid4()),
            email=data.email.lower().strip(),
            full_name=data.full_name.strip(),
            hashed_password=get_password_hash(data.password),
            is_active=True
        )
        db.add(user)

        # 3. Create Business
        business = Business(
            id=str(uuid.uuid4()),
            name=data.business_name.strip(),
            legal_name=f'«{data.business_name.strip()}» ՍՊԸ',
            hvhh=data.hvhh or "02258941",
            is_active=True
        )
        db.add(business)

        # 4. Create Owner Membership
        membership = BusinessMembership(
            id=str(uuid.uuid4()),
            user_id=user.id,
            business_id=business.id,
            role=RoleEnum.OWNER,
            is_active=True
        )
        db.add(membership)

        # 5. Create Default Central Warehouse
        warehouse = Warehouse(
            id=str(uuid.uuid4()),
            business_id=business.id,
            name_am="Կենտրոնական Պահեստ",
            code="WH-MAIN",
            address="ք. Երևան, Արշակունյաց 15",
            is_default=True
        )
        db.add(warehouse)

        # 6. Create Employee profile for owner
        employee = Employee(
            id=str(uuid.uuid4()),
            business_id=business.id,
            user_id=user.id,
            warehouse_id=warehouse.id,
            full_name_am=user.full_name,
            role="ադմինիստրատոր",
            email=user.email,
            is_active=True
        )
        db.add(employee)

        await db.commit()
        await db.refresh(user)
        await db.refresh(business)

        # Generate JWT token
        token_str = create_access_token(
            subject=user.id,
            business_id=business.id,
            role=RoleEnum.OWNER.value
        )

        return Token(
            access_token=token_str,
            token_type="bearer",
            user_id=user.id,
            email=user.email,
            full_name=user.full_name,
            business_id=business.id,
            business_name=business.name,
            role=RoleEnum.OWNER
        )

    @staticmethod
    async def authenticate_user(db: AsyncSession, credentials: UserLogin) -> Token:
        """Authenticate user and return JWT with active business context."""
        stmt = select(User).where(User.email == credentials.email.lower().strip())
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()

        if not user or not verify_password(credentials.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Սխալ էլ․ հասցե կամ գաղտնաբառ:"
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Ձեր օգտահաշիվը ապաակտիվացված է:"
            )

        # Find primary active business membership
        mem_stmt = select(BusinessMembership).where(
            BusinessMembership.user_id == user.id,
            BusinessMembership.is_active == True
        )
        mem_res = await db.execute(mem_stmt)
        membership = mem_res.scalars().first()

        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Օգտատերը չունի ակտիվ բիզնեսի անդամակցություն:"
            )

        biz_stmt = select(Business).where(Business.id == membership.business_id)
        biz_res = await db.execute(biz_stmt)
        business = biz_res.scalar_one()

        token_str = create_access_token(
            subject=user.id,
            business_id=business.id,
            role=membership.role.value
        )

        return Token(
            access_token=token_str,
            token_type="bearer",
            user_id=user.id,
            email=user.email,
            full_name=user.full_name,
            business_id=business.id,
            business_name=business.name,
            role=membership.role
        )
